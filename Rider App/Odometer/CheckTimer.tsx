import React, { FunctionComponent, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch } from 'react-native-paper';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/font';
import OdometerModal from '../OdometerModal';

const CheckInTimer: FunctionComponent<{
    time: any;
    setRiderActive: (val: boolean) => void;
    riderActive: boolean;
}> = ({ time, setRiderActive, riderActive }) => {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');
    // const [loginCount, setLoginCount] = useState(0);

    // useEffect(() => {
    //   setLoginCount(loginCount + 1);
    //   if (loginCount >= 1) {
    //     setShowModal(true);
    //   }
    // }, [riderActive]);


    const handleSwitch = () => {
        setShowModal(prev => !prev);
        // setRiderActive(!riderActive);
    }

    useEffect(() => {
        if (riderActive === false) {
            setMessage('Are you ready to take orders?');
        } else {
            setMessage('Want to go inactive? Orders will not be assigned.');
        }
    }, [riderActive]);

    return (
        <View style={styles.riderStatus}>
            <View
                style={{
                    width: '50%',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                }}>
                {showModal && (
                    <OdometerModal vis={showModal} setVis={() => { setShowModal(false) }} message={message} />
                )}
                <Switch
                    color={Colors.action.green1}
                    value={riderActive}
                    onValueChange={() => handleSwitch()}
                    style={styles.switch}
                />
                <Text
                    style={{
                        ...styles.text,
                        textAlignVertical: 'center',
                        fontSize: 14,
                    }}>
                    {riderActive ? 'Active' : 'In-Active'}
                </Text>
            </View>
            <View
                style={{
                    width: '50%',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                }}>
                <Text
                    style={{
                        ...styles.text,
                        textAlignVertical: 'center',
                        fontSize: 14,
                    }}>
                    {riderActive ? time : 'Rider In-Active'}
                </Text>
            </View>
        </View>
    );
};

export default CheckInTimer;


const styles = StyleSheet.create({
    riderStatus: {
        height: 50,
        maxHeight: 50,
        flexDirection: 'row',
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
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
});
