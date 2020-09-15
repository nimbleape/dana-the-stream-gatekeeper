import React, {createContext, useReducer, useEffect} from 'react';
import { appReducer } from '../reducers/appReducer';
import jssip from "jssip";

export const {Provider, Consumer} = createContext();

export const withContext = Component =>
    props => <Consumer>
        {value => <Component {...value} {...props} />}
    </Consumer>

const baseState = {
    name: '',
    serverWssUri: '',
    sipUri: '',
    password: '',
    chosenAudioInput: '',
    chosenVideoInput: '',
    chosenAudioOutput: '',
    mqttUri: '',
    dontShowSettings: false
};

const AppProvider = (props) => {

    const [state, dispatch] = useReducer(appReducer, {}, () => {
        const appString = localStorage.getItem('app');
        let localData;

        if (appString) {
            localData = JSON.parse(appString);
        } else {
            localData = {};
        }

        /*
         * Override connection properties with those specified in the query
         * string (if any) and default the SIP and websocket URIs.
         */

        let params = {...baseState, ...localData};

        let queryParams = new URLSearchParams(window.location.search);
        queryParams.forEach((value, key) => {
            if (key in baseState) {
                params[key] = value;
            }
        });

        if (!params.sipUri) {
            params.sipUri = window.location.hostname;
        }

        if (!params.sipUri.match(/sip[s]*:/)) {
            params.sipUri = "sip:" + params.sipUri;
        }

        let sipUri = jssip.URI.parse(params.sipUri);
        if (!sipUri) {
            throw new Error("Invalid sipUri: " + params.sipUri);
        }

        if (!sipUri.user) {
            sipUri.user = queryParams.get("user");
        }
        if (!sipUri.port) {
            sipUri.port = 5061;
        }

        params.sipUri = sipUri.toString();

        if (!params.serverWssUri) {
            params.serverWssUri = "wss://" + sipUri.host + ":8089/ws";
        }

        return params;
    });

    useEffect(() => {
        localStorage.setItem('app', JSON.stringify(state))
    }, [state]);

    return (
        <Provider value={{...state, dispatch}}>
            { props.children }
        </Provider>
    );
}

export default AppProvider;