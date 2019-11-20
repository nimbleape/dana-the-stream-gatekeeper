import React, {createContext, useReducer, useEffect} from 'react';
import { appReducer } from '../reducers/appReducer';

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
    chosenAudioOutput: ''
};

const AppProvider = (props) => {

    const [state, dispatch] = useReducer(appReducer, {}, () => {
        const localData = localStorage.getItem('app');
        return localData ? {...baseState, ...JSON.parse(localData)} : baseState;
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