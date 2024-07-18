import {
    Alert,
    Image,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Portal, TextInput } from 'react-native-paper';
import { Colors } from '../../constants/colors';
import SolidButton from '../Button/SolidButton';
import { selectUser, setActive } from '../../redux/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Fonts } from '../../constants/font';
import { launchCamera } from 'react-native-image-picker';
import { UpdateDriverStatus } from '../../API/Driver';
import ActivityBanner from '../Banner';
import LocalStorage from '../../utils/LocalStorage';

type modal = {
    vis: boolean;
    setVis: () => void;
    status?: string;
    message: string;
};

const OdometerModal: FunctionComponent<any> = ({
    vis,
    setVis,
    status, // TODO: Check if this is needed
    message,
}: modal) => {
    // const [meterReading, setMeterReading] = useState<any>();
    // const [image, setImage] = useState<any>();
    // const [bannerShow, setBannerShow] = useState({
    //   show: false,
    //   type: '',
    //   message: ' ',
    //   delay: 1500,
    // });
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    // const [message, setMessage] = useState<string>('Are you ready to take orders?');

    // useEffect(() => {
    //   if (user.is_active !== 1) {
    //     setMessage('Are you ready to take orders?');
    //   } else {
    //     setMessage('Want to go inactive? Orders will not be assigned.');
    //   }
    // }, [user.is_active, vis]);

    // useEffect(() => {
    //   if (bannerShow.show) {
    //     setTimeout(() => {
    //       setBannerShow({ ...bannerShow, show: false, type: '', message: '' });
    //     }, bannerShow.delay);
    //   }
    // }, [bannerShow]);

    // const handleCaptureImage = async () => {
    //   try {
    //     const result = await launchCamera({
    //       maxWidth: 1280,
    //       maxHeight: 720,
    //       quality: 0.5,
    //       mediaType: 'photo',
    //       cameraType: 'back',
    //       includeBase64: true,
    //       saveToPhotos: false,
    //     });

    //     if (result.assets) {
    //       return setImage(result.assets[0]);
    //     } else if (result.didCancel) Alert.alert('Odometer Picture required.');
    //   } catch (error) {
    //     console.error(error);
    //   }
    //   return;
    // };

    // const handleSubmit = async () => {
    //   setVis()
    // if (meterReading && image) {
    //   const data = {
    //     image: 'data:image/jpeg;base64,' + image.base64,
    //     is_active: status === 'logout' ? false : user.is_active,
    //     value: meterReading,
    //   };
    //   // TODO: UPDATE DRIVER STATUS API CALL
    //   const result = await UpdateDriverStatus(user.id, data);
    //   try {
    //     if (result.kind === 'success') {
    //       // When user submits then show the success or failure status inside the modal content
    //       setBannerShow({
    //         ...bannerShow,
    //         type: 'ok',
    //         show: true,
    //         message: 'Reading sent Successfully',
    //       });

    //       return setVis();
    //     } else if (result.kind === 'failure') {
    //       setBannerShow({
    //         ...bannerShow,
    //         type: 'error',
    //         show: true,
    //         message: result?.body?.message ?? 'Something went wrong',
    //       });
    //     }
    //   } catch (error) {
    //     setBannerShow({
    //       ...bannerShow,
    //       type: 'error',
    //       show: true,
    //       message: result?.body?.message ?? 'Something went wrong',
    //     });
    //   }
    // } else {
    //   Alert.alert('', 'Odometer picture & reading required');
    // }
    // };

    // const handleClose = async () => {
    //   try {
    //     const user = await LocalStorage.getItem('@zr-rider');
    //     if (user.active === false) {
    //       user.active = true;
    //       await LocalStorage.setItem('@zr-rider', user);
    //       dispatch(setActive(true));
    //     } else if (user.active === true) {
    //       user.active = false;
    //       await LocalStorage.setItem('@zr-rider', user);
    //       dispatch(setActive(false));
    //     }
    //     setVis();
    //   } catch (error) {
    //     console.error('Error while close:', error);
    //   }
    // };

    const handleConfirmation = () => {
        // console.log('>>> BEFORE STATUS CHANGE', user.is_active);

        if (user.is_active === 1) {
            dispatch(setActive(false));
        } else {
            dispatch(setActive(true));
        }
        setVis();
    };

    return (
        <Portal>
            <Modal
                visible={vis}
                onDismiss={setVis}
                dismissable={false}
                contentContainerStyle={styles.containerStyle}>
                <View style={styles.card}>
                    <Text style={styles.text}>{message}</Text>

                    {/* {bannerShow.show && (
            <ActivityBanner
              type={bannerShow.type}
              message={bannerShow.message}
              delay={bannerShow.delay}
            />
          )} */}
                    {/* <TextInput
            label="Enter Odometer Reading"
            placeholder="000000"
            style={{marginBottom: 15}}
            value={meterReading}
            mode={'outlined'}
            selectionColor={Colors.background}
            keyboardType={'numeric'}
            maxLength={6}
            onChange={e => {
              setMeterReading(e.nativeEvent.text);
            }}
          /> */}
                    {/* <TouchableOpacity onPress={handleCaptureImage} style={styles.card}>
            <View style={styles.iconHolder}>
              <Icon
                style={styles.icon}
                name={'camera'}
                size={25}
                color={'#fff'}
              />
            </View>
            <Text>Take Odometer Picture</Text>
          </TouchableOpacity> */}
                    {/* <View style={styles.odometerImageContainer}>
            {image ? (
              <View>
                <Image
                  source={{
                    uri: image.uri,
                    width: 150,
                    height: 150,
                  }}
                  resizeMode={'contain'}
                />
              </View>
            ) : (
              <Text style={{textAlign: 'center', paddingVertical: 10}}>
                Provide Odometer Image to proceed
              </Text>
            )}

            {image && (
              <TouchableOpacity
                onPress={() => setImage(null)}
                style={styles.loadImageButton}>
                <Icon name={'trash'} size={25} color={Colors.action.red} />
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors.action.red,
                    textAlignVertical: 'center',
                    padding: 10,
                  }}>
                  {'Remove Photo'}
                </Text>
              </TouchableOpacity>
            )}
          </View> */}
                    <View style={{ flexDirection: 'row' }}>
                        <SolidButton
                            text={'Yes'}
                            action={handleConfirmation}
                            buttonStyle={{ marginTop: 10, padding: 5, borderRadius: 5, marginRight: 10, width: 80 }}
                        />

                        <SolidButton
                            text={'Cancel'}
                            action={() => setVis()}
                            buttonStyle={{ marginTop: 10, padding: 5, borderRadius: 5, backgroundColor: 'white', width: 80 }}
                            textStyle={{ color: 'black' }}
                        />
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};

export default OdometerModal;

const styles = StyleSheet.create({
    containerStyle: {
        backgroundColor: '#fff',
        borderRadius: 10,
        height: '20%',
        alignSelf: 'center',
        width: '80%',
        justifyContent: 'space-between',
        padding: 10,
    },
    text: {
        height: '100%',
        paddingLeft: 10,
        fontSize: 18,
        // marginRight: 10,
        color: Colors.text.d1,
        fontFamily: Fonts.regular,
        textAlignVertical: 'center',
    },
    card: {
        height: '40%',
        width: '100%',
        backgroundColor: Colors.background,
        alignItems: 'center',
        borderRadius: 5,
    },
    // iconHolder: {
    //   height: '100%',
    //   width: '20%',
    //   alignItems: 'center',
    //   justifyContent: 'center',
    // },
    // icon: {
    //   backgroundColor: Colors.secondary,
    //   borderRadius: 6,
    //   height: '50%',
    //   width: '70%',
    //   textAlignVertical: 'center',
    //   textAlign: 'center',
    // },
    // loadImageButton: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    // },
    // odometerImageContainer: {
    //   marginTop: 10,
    //   alignItems: 'center',
    //   flexDirection: 'row',
    // },
});
