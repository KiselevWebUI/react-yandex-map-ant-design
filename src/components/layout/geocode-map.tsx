import { Placemark, Map, useYMaps, Panorama } from '@pbe/react-yandex-maps';
import styled from 'styled-components';
import config from '../../config/config.json';
import { useEffect, useState } from 'react';
import { IGeocodeResult } from 'yandex-maps';
import { Button, Flex, Popconfirm, Table, TableProps, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

type CoordinatesType = Array<number>;

interface IMapClickEvent {
    get: (key: string) => CoordinatesType
};

interface IAddress {
    location: string;
    route: string
};

interface ISavedObject {
    id: string;
    address: IAddress | null;
    coordinates: CoordinatesType | null;
};

const CardWithGeocodeMap = styled(Flex)`
    width: 100%;
    flex-direction: column;
    gap: 10px;
`;

const CardWithMapWrapper = styled(Flex)`
    height: 500px;
    gap: 10px;
`;

const MapWithGeocode = styled(Map)`
    width: 75%;
    border: 1px solid black;
    border-radius: 10px;
    overflow: hidden;
`;

const LoacationInfoCard = styled(Flex)`
    width: 25%;
    border: 1px solid black;
    border-radius: 10px;
    overflow: hidden;
    padding: 10px;
`;

const EmptyAddress = styled(Flex)`
    width: 25%;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    border: 1px solid black;
    border-radius: 10px;
    padding: 10px;
`;

const EmptyAddressMessage = styled(Typography.Title)`
    width: 100%;
    text-align: center;
    font-size: 14px !important;
`;

const AddressWithCoodinates = styled(Flex)`
    justify-content: center;
    flex-direction: column;
`;

const InfoWithPanaramaWraper = styled(Flex)`
    width: 100%;
    height: 100%;
    flex-direction: column;
`;

const PanaramaStyled = styled(Panorama)`
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 10px;
`;

const TableStyled = styled(Table)`
    width: 100%;
    border: 1px solid #000000;
    border-radius: 10px;
`;

const NoPanaramaWrapper = styled(Flex)`
    border-radius: 10px;
    border: 1px solid grey;  
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    color: #999;
    margin: 6px 0;
    font-size: 16px;
    text-align: center;
`;

const MapObjectsDisplay = styled(Map)`
    width: 100%;
    height: 400px;
    border: 1px solid gray;
    border-radius: 10px;
    overflow: hidden;
`;


const GeocodeMap = () => {

    const [coordinates, setCoordinates] = useState<CoordinatesType | null>(null);
    const [address, setAddress] = useState<IAddress | null>(null);
    const [hasPanarama, setHasPanarama] = useState<boolean>(false);

    const [objArray, setObjArray] = useState<ISavedObject[]>([]);

    const ymaps = useYMaps(['geocode']);

    const formattedCoordinates = coordinates ? `${coordinates[0]?.toFixed(6)}, ${coordinates[1]?.toFixed(6)}` : null;

    const handleClickMap = (e: IMapClickEvent) => {

        const coords = e.get("coords");

        if(coords){
            setCoordinates(coords);
        }

        ymaps?.geocode(coords).then((result) => {
            const address = handleGeoResult(result);
            if(address){
                setAddress(address);
            }
            
        }).catch((error: unknown) => {
            console.log("Error address: ", error);
            setAddress(null);
        })

        ymaps?.panorama.locate(coords).then((panarama) => {
            setHasPanarama(!!panarama.length);
        }).catch((error: unknown) => {
            console.log("Error panarama: ", error);
            setHasPanarama(false);
        })
        
    }

    function handleGeoResult(result: IGeocodeResult){
        const firstGeoObject = result.geoObjects.get(0);

        if(firstGeoObject){
            const properties = firstGeoObject.properties;

            const location = String(properties.get("description", {}));
            const route = String(properties.get("name", {}));

            const address = {
                location,
                route
            };

            return address;
        }
    }

    const handleSaveAddress = () => {
        const localStorageObject = localStorage.getItem('yandexAddressObjects');
        const objArray = localStorageObject ? JSON.parse(localStorageObject) : [];
        const newAddressObject = {
            id: uuidv4(),
            address,
            coordinates
        }
        objArray.push(newAddressObject);
        localStorage.setItem('yandexAddressObjects', JSON.stringify(objArray));
        setObjArray(objArray);
    }

    const handleDelete = (id: string) => {

        const objArrayAfterDelete = objArray.filter(item => item.id !== id);
        localStorage.setItem('yandexAddressObjects', JSON.stringify(objArrayAfterDelete));
        setObjArray(objArrayAfterDelete);
    }

    //table

    const loadSavedObjects = () => {
        const localStorageObject = localStorage.getItem('yandexAddressObjects');
        
        if(localStorageObject){
            const parsedOblects = JSON.parse(localStorageObject).map((item: ISavedObject) => ({
                ...item,
                key: item.id
            }));
            setObjArray(parsedOblects);
        }else{
            setObjArray([]);
        }
    }

    useEffect(() => {
        loadSavedObjects()
    }, [])
      
    const columns: TableProps["columns"] = [
        {
            title: 'Локация',
            dataIndex: ["address", "location"],
            key: 'address.location',
        },
        {
            title: 'Адрес',
            dataIndex: ["address", "route"],
            key: 'address.route',
        },
        {
            title: 'Координаты',
            dataIndex: 'coordinates',
            key: 'coordinates',
            render: (coords: number[]) => `${coords[0]}, ${coords[1]}`
        },
        {
            title: '',
            dataIndex: '',
            key: 'id',
            render: (text, record) => 
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
                <a>Delete</a>
            </Popconfirm>
        },
    ];

    return (
        <CardWithGeocodeMap>
            <CardWithMapWrapper>
            { address ? 
                <LoacationInfoCard>
                    <InfoWithPanaramaWraper>
                        <AddressWithCoodinates vertical>
                            <Typography.Text><b><u>Локация</u>:</b> { `${address?.location}` }</Typography.Text>
                            <Typography.Text><b><u>Адрес</u>:</b> { `${address?.route}` }</Typography.Text>
                            <Typography.Text><b><u>Координаты</u>:</b> { `${formattedCoordinates}` }</Typography.Text>
                        </AddressWithCoodinates>
                        { hasPanarama && coordinates ? 
                            (<PanaramaStyled key={coordinates?.join(',')} defaultPoint={coordinates ?? undefined} /> )
                            : 
                            (<NoPanaramaWrapper vertical>
                                <FormOutlined style={{ fontSize: "100px" }}/>
                                <Typography.Title>Нет панарамы</Typography.Title>
                            </NoPanaramaWrapper>)
                        }
                         <Button type="primary" style={{marginTop: '6px'}} onClick={ handleSaveAddress }>Сохранить адрес</Button>
                    </InfoWithPanaramaWraper>
                </LoacationInfoCard> 
                : 
                <EmptyAddress>
                    <EmptyAddressMessage>
                        Выберите точку на карте
                    </EmptyAddressMessage>
                </EmptyAddress>
            }
            <MapWithGeocode 
                defaultState={{ 
                    center: config.CITY, zoom: config.ZOOM 
                }}
                onClick={ (e: IMapClickEvent) => handleClickMap(e) }
            >
                { coordinates && <Placemark geometry={coordinates} /> }
            </MapWithGeocode>
            </CardWithMapWrapper>
            <TableStyled dataSource={objArray} columns={columns} rowKey="id" />
            <MapObjectsDisplay 
                defaultState={{ 
                    center: config.CITY, zoom: config.ZOOM 
                }}
                onClick={ (e: IMapClickEvent) => handleClickMap(e) }
            >
                {objArray.map((obj) => 
                     obj.coordinates && 
                     <Placemark key={obj.id} geometry={obj.coordinates} properties={{balloonContent: `<strong>${obj?.address?.location}<br/>${obj?.address?.route}</strong>`}}/> 
                )}
            </MapObjectsDisplay>
        </CardWithGeocodeMap>
    )
}

export default GeocodeMap;