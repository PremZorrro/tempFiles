import {
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Text,
    ToastAndroid,
    Image,
    Dimensions,
    View,
} from 'react-native';
import React, {
    useState,
    useEffect,
    useContext,
    FunctionComponent,
    useMemo,
    useRef,
    useCallback,
} from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { Fonts } from '../../../constants/font';
import { Colors } from '../../../constants/colors';
import dayjs from 'dayjs';
import { Icons } from '../../../constants/icons';
import OrderCard from '../../../components/OrderCard';
import Geolocation from 'react-native-geolocation-service';
import { GetActiveOrders, GetAllOrders } from '../../../API/Orders';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectActive,
    selectUser,
    setActive,
    setLocation,
    setLoc_Name,
} from '../../../redux/slices/authSlice';
import LoadingActivity from '../../../components/Loader';
import {
    selectIsRefreshOrder,
    selectOrderList,
} from '../../../redux/slices/orderSlice';
import EmptyIndicator from '../../../components/EmptyIndicator';
import { GetLocationName } from '../../../API/Location';
import { GetDriverStats } from '../../../API/Driver';
import useGetUser from '../../../hooks/useGetUser';
import LocalStorage from '../../../utils/LocalStorage';
import { useIsFocused } from '@react-navigation/native';
import { GetRiderAds } from '../../../API/GetAds';
import CheckForInternet from '../../../utils/CheckInternet';
import SocketContext from '../../../contexts/socket';
import CheckInTimer from '../../../components/CheckTimer';
import DashboardPins from '../../../components/DashboardPins';
import { OpenURL } from '../../../utils/LaunchIntents';
import SoundPlayer from 'react-native-sound-player';
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.locale('en-in');

const sortingOrderData = [
    {
        label: 'Newest First',
        value: 1,
    },
    {
        label: 'Oldest First',
        value: 2,
    },
];

SoundPlayer.loadSoundFile('siren25', 'mp3');

const StopSound = () => {
    SoundPlayer.pause();
    SoundPlayer.seek(0);
};

SoundPlayer.addEventListener('FinishedPlaying', () => {
    StopSound();
});

const OrdersListing: FunctionComponent<{ navigation: any }> = ({ navigation }) => {
    const PROPSFORTOBUTTONS = {
        style: { ...styles.orderTabs },
    };
    const riderActive = useSelector(selectActive);
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const adList = useRef<any[]>([]);
    const [paginators, setPaginators] = useState({
        noOfPages: 0,
        currPage: 1,
        totalRows: 0,
    });
    const [activePaginators, setActivePaginators] = useState({
        noOfPages: 0,
        currPage: 1,
        totalRows: 0,
    });
    const [refreshing, setRefreshing] = useState<boolean>(true);
    const [orders, setOrders] = useState<any>([]);
    const [activeOrders, setActiveOrders] = useState<any>([]);
    const isRefreshOrder = useSelector(selectIsRefreshOrder);
    const [filterBy, setFilterBy] = useState<'active' | 'all'>('active');
    const [activeOrderlength, setActiveOrderlength] = useState<number>(0);
    const orderList = useSelector(selectOrderList);
    const [activeOrderButtonProps, setActiveOrderButtonProps] = useState<any>({
        ...PROPSFORTOBUTTONS,
    });
    const { socket } = useContext(SocketContext);
    const [allOrderButtonProps, setAllOrderButtonProps] = useState<any>({
        ...PROPSFORTOBUTTONS,
    });
    const width = Dimensions.get('screen').width;
    const CallLocationNameAPI = async (loc_coords: {
        lat: number;
        lon: number;
    }) => {
        let name = await GetLocationName(loc_coords);
        dispatch(setLoc_Name({ name }));
    };
    const onToggleSwitch = async (value: boolean) => {
        console.log('>> USER DATA ', user);
        console.log('>>>> onToggle Switch Handler :', value);
        if (user.active === value) {
            dispatch(setActive(value));
            const user = await LocalStorage.getItem('@zr-rider');
            await LocalStorage.setItem('@zr-rider', { ...user, active: value });
        }
    };
    const uniqueArray = (a: any[]) => {
        const ordersID = a.map(b => b.id);
        const unique = [...new Set(ordersID.map(o => JSON.stringify(o)))].map(s =>
            JSON.parse(s),
        );
        return unique.map(item => {
            return a.filter(b => b.id === item)[
                a.filter(b => b.id === item).length - 1
            ];
        });
    };

    const { refreshDriver } = useGetUser();
    useEffect(() => {
        Geolocation.getCurrentPosition(
            position => {
                if (!position.mocked) {
                    dispatch(
                        setLocation({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                        }),
                    );
                    CallLocationNameAPI({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                }
            },
            error => {
                console.error('>> Order Listing location err,', error);
                SoundPlayer.play();
                setTimeout(() => StopSound(), 10000);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 10,
            },
        );
    }, []);

    useEffect(() => {
        setLoading(true);
        setRefreshing(true);
        FetchAllOrders();
        FetchActiveOrders();
    }, [isRefreshOrder, filterBy]);

    const focused = useIsFocused();
    useEffect(() => {
        if (!socket?.connected) socket?.connect();
        socket?.emit('client_up', JSON.stringify({ user_id: user?.id }));
        const refresher = setInterval(async () => {
            if (
                riderActive &&
                focused &&
                (await CheckForInternet()) &&
                filterBy === 'active'
            )
                FetchActiveOrders();
        }, 9000);

        return () => clearInterval(refresher);
    }, [paginators, filterBy, focused]);

    const handleFilterButtons = () => {
        if (filterBy === 'active') {
            setActiveOrderButtonProps({
                ...PROPSFORTOBUTTONS,
                style: {
                    ...PROPSFORTOBUTTONS.style,
                    ...styles.borderRadiusLeft,
                    backgroundColor: Colors.accent,
                },
                onPress: () => setFilterBy('active'),
            });
            setAllOrderButtonProps({
                ...PROPSFORTOBUTTONS,
                style: {
                    ...PROPSFORTOBUTTONS.style,
                    ...styles.borderRadiusRight,
                },
                onPress: () => setFilterBy('all'),
            });
        } else {
            setActiveOrderButtonProps({
                ...PROPSFORTOBUTTONS,
                style: {
                    ...PROPSFORTOBUTTONS.style,
                    ...styles.borderRadiusLeft,
                },
                onPress: () => setFilterBy('active'),
            });
            setAllOrderButtonProps({
                ...PROPSFORTOBUTTONS,
                style: {
                    ...PROPSFORTOBUTTONS.style,
                    ...styles.borderRadiusRight,
                    backgroundColor: Colors.accent,
                },
                onPress: () => setFilterBy('active'),
            });
        }
    };

    useEffect(() => {
        // handleFliterOrders();
        handleFilterButtons();
    }, [filterBy, orders]);

    const [time, setTime] = useState(dayjs().format(' hh:mm a'));

    useEffect(() => {
        const timer = setInterval(() => {
            var now = dayjs().format(' hh:mm a');
            setTime(now);
        }, 60 * 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const FetchActiveOrders = async (increment: boolean = false) => {
        const fetchOrders = await GetActiveOrders(
            user.id,
            increment
                ? activePaginators?.currPage + 1 <= activePaginators?.noOfPages
                    ? activePaginators?.currPage + 1
                    : activePaginators?.currPage
                : activePaginators?.currPage,
            increment ? 40 : activePaginators.currPage * 40,
        );

        if (fetchOrders.kind === 'success') {
            setActiveOrders((prev: any) => {
                return increment
                    ? uniqueArray([...prev, ...fetchOrders.body.orders])
                    : uniqueArray([...fetchOrders.body.orders]);
            });
            if (increment) {
                setActivePaginators({
                    noOfPages: fetchOrders.body?.noOfPages,
                    currPage: increment
                        ? fetchOrders.body?.currPage + 1 <= fetchOrders.body?.noOfPages
                            ? fetchOrders.body?.currPage + 1
                            : fetchOrders.body?.currPage
                        : fetchOrders.body?.currPage,
                    totalRows: fetchOrders.body?.totalRows,
                });
            }
            setLoading(false);
            setRefreshing(false);
        } else {
            console.error(fetchOrders.body);
            // ToastAndroid.showWithGravity(
            //   'An error occured while fetching orders. Please check your internet connection!',
            //   ToastAndroid.LONG,
            //   ToastAndroid.CENTER,
            // );
            setLoading(false);
            setRefreshing(false);
        }
    };
    const FetchAllOrders = async (increment: boolean = false) => {
        const fetchOrders = await GetAllOrders(
            user.id,
            increment
                ? paginators?.currPage + 1 <= paginators?.noOfPages
                    ? paginators?.currPage + 1
                    : paginators?.currPage
                : paginators?.currPage,
            increment ? 40 : paginators.currPage * 40,
        );
        if (fetchOrders.kind === 'success') {
            setOrders((prev: any) => {
                return increment
                    ? uniqueArray([...prev, ...fetchOrders.body.orders])
                    : uniqueArray([...fetchOrders.body.orders]);
            });
            if (increment) {
                setPaginators({
                    noOfPages: fetchOrders.body?.noOfPages,
                    currPage: increment
                        ? fetchOrders.body?.currPage + 1 <= fetchOrders.body?.noOfPages
                            ? fetchOrders.body?.currPage + 1
                            : fetchOrders.body?.currPage
                        : fetchOrders.body?.currPage,
                    totalRows: fetchOrders.body?.totalRows,
                });
            }
            setLoading(false);
            setRefreshing(false);
        } else {
            console.error(fetchOrders.body);
            // ToastAndroid.showWithGravity(
            //   'An error occured while fetching orders. Please check your internet connection!',
            //   ToastAndroid.LONG,
            //   ToastAndroid.CENTER,
            // );
            setLoading(false);
            setRefreshing(false);
        }
    };
    const stats = useRef({
        activeOrders: 0,
        deliveredOrders: 0,
        scheduledOrders: 0,
    });

    const GetStats = async () => {
        try {
            const res = await GetDriverStats(user?.id);
            if (res.kind === 'success') {
                stats.current = res.body.stats;
            }
        } catch (err) {
            console.error(err);
        }
    };
    useMemo(() => {
        GetStats();
    }, [stats, orders.length]);

    const FetchAdList = async () => {
        try {
            const response = await GetRiderAds();
            if (response.kind === 'success') {
                adList.current = response.body.data;
            }
        } catch (err) {
            console.error(err);
        }
    };
    useMemo(() => {
        FetchAdList();
    }, [adList]);

    const renderOrderCard = ({ item }: { item: any }) => (
        <OrderCard navigation={navigation} order={item} filterBy={filterBy} />
    );

    const bannerCard = (item: any) => {
        if (item.url && item.url !== '' && item.url !== null) {
            if (item.url === 'Announcement') {
                return (
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => {
                            navigation.navigate('notifications');
                        }}>
                        <Image
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 10,
                            }}
                            source={{ uri: item.image }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                );
            } else {
                return (
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        onPress={() => {
                            OpenURL(item.url);
                        }}>
                        <Image
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 10,
                            }}
                            source={{ uri: item.image }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                );
            }
        } else {
            <Image
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 10,
                }}
                source={{ uri: item.image }}
                resizeMode={'contain'}
            />;
        }
    };

    return (
        <View style={styles.container}>
            {/* Rider Active Status Bar */}
            <LoadingActivity vis={loading || refreshing} />
            <CheckInTimer
                riderActive={riderActive}
                setRiderActive={onToggleSwitch}
                time={time}
            />

            {/* Order Listings */}
            <>
                {adList.current?.length > 0 && (
                    <View
                        style={{
                            backgroundColor: Colors.primary,
                            paddingVertical: 5,
                        }}>
                        <Carousel
                            loop
                            width={width}
                            height={width / 3.25}
                            autoPlay={true}
                            data={adList.current}
                            scrollAnimationDuration={1000}
                            renderItem={({ item }: any) => (
                                <View
                                    style={{
                                        width: width,
                                        height: width / 3.25,
                                        overflow: 'hidden',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingHorizontal: 10,
                                    }}>
                                    {bannerCard(item)}
                                </View>
                            )}
                        />
                    </View>
                )}
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View
                                style={{
                                    ...styles.riderOrderAnalytics,
                                }}>
                                {/* Three Board Items */}
                                <DashboardPins
                                    activeOrders={stats.current?.activeOrders}
                                    deliveredOrders={stats.current?.deliveredOrders}
                                    scheduledOrders={stats.current?.scheduledOrders}
                                />

                                {/* Switch for All order and new Order */}
                                <View
                                    style={{
                                        height: '25%',
                                        flexDirection: 'row',
                                        marginHorizontal: 20,
                                        marginVertical: 12,
                                    }}>
                                    <TouchableOpacity {...activeOrderButtonProps}>
                                        <Text
                                            style={{
                                                ...styles.text,
                                                fontSize: 14,
                                                color: Colors.text.l2,
                                            }}>
                                            Active Orders ({activeOrders.length})
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity {...allOrderButtonProps}>
                                        <Text
                                            style={{
                                                ...styles.text,
                                                fontSize: 14,
                                                color: Colors.text.l2,
                                            }}>
                                            All Orders
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {/* {filteredOrders.length > 0 && filterBy === 'all' && (
                <View
                  style={{
                    flexDirection: 'row',
                    marginHorizontal: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                  }}>
                  <Text style={{...styles.text, color: Colors.text.d1}}>
                    All Orders ({orders.length})
                  </Text>
                </View>
              )} */}
                        </>
                    )}
                    data={filterBy === 'active' ? activeOrders : orders}
                    onEndReached={async () => {
                        filterBy === 'active'
                            ? await FetchActiveOrders(true)
                            : await FetchAllOrders(true);
                    }}
                    renderItem={renderOrderCard}
                    keyExtractor={order => order?.id}
                    onRefresh={async () => {
                        refreshDriver(user.mobile);
                        filterBy === 'active'
                            ? await FetchActiveOrders(true)
                            : await FetchAllOrders(true);
                    }}
                    contentContainerStyle={{
                        paddingBottom: 20,
                    }}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    ListEmptyComponent={() => (
                        <EmptyIndicator text="No Orders in the last 3 Months" />
                    )}
                // code for hiding the dashboard pin
                // onScroll={e => {
                //   if (e.nativeEvent.contentOffset.y === 0)
                //     return setShowDashBoard(true);
                //   return setShowDashBoard(false);
                // }}
                />
            </>

        </View>
    );
};

export default OrdersListing;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    riderStatus: {
        height: 50,
        maxHeight: 50,
        flexDirection: 'row',
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
    },
    riderOrderAnalytics: {
        height: 220,
        maxHeight: 230,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
    },
    switch: {
        marginRight: 10,
    },
    text: {
        fontFamily: Fonts.medium,
        color: Colors.text.d2,
    },
    border: {
        borderWidth: 2,
        borderColor: 'red',
    },
    orderTabs: {
        width: '50%',
        textAlignVertical: 'center',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.accent,
    },
    borderRadiusLeft: {
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    borderRadiusRight: {
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
});
