import React, { Component } from 'react';
import AppProvider from './contexts/AppContext';
import ThemeProvider from './contexts/ThemeProvider';
import Routes from './components/Routes';

import './App.css';

class App extends Component {

    render() {
        return (
            <ThemeProvider>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <AppProvider>
                    <Routes />
                </AppProvider>
            </ThemeProvider>
        );
    }
}

export default App;
