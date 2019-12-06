export const appReducer = (state, action) => {
    switch(action.type) {
        case 'UPDATE_CHOSEN_MIC':
            return {...state, ...{ chosenAudioInput: action.deviceId }};
        case 'UPDATE_CHOSEN_CAMERA':
            return {...state, ...{ chosenVideoInput: action.deviceId }};
        case 'UPDATE_CHOSEN_OUTPUT':
            return {...state, ...{ chosenAudioOutput: action.deviceId }};
        case 'UPDATE_WSS_ADDRESS':
            return {...state, ...{ serverWssUri: action.data }};
        case 'UPDATE_SIP_URI':
            return {...state, ...{ sipUri: action.data }};
        case 'UPDATE_PASSWORD':
            return {...state, ...{ password: action.data }};
        case 'UPDATE_NAME':
            return {...state, ...{ name: action.data }};
        case 'UPDATE_MQTT_URI':
            return {...state, ...{ mqttUri: action.data }};
        default:
            return state;
    }
};