import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { makeStyles } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Settings from './Settings';
import VideoRoom from './VideoRoom';
import Login from './Login';
import MediaSettings from './MediaSettings';

const prefix = process.env.REACT_APP_PREFIX ? process.env.REACT_APP_PREFIX.replace('http://', '') : '/';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    }
}));

const ReactRouter = () => {

    const classes = useStyles();

    return (
        <Router basename={prefix}>
            <div className={classes.root}>
                <CssBaseline />
                <Switch>
                    <Route exact path="/" component={Login} />
                    <Route path="/login" component={Login} />
                    <Route path="/settings" component={Settings} />
                    <Route path="/media-settings" component={MediaSettings} />
                    <Route path="/video/:name" component={VideoRoom} />
                </Switch>
            </div>
        </Router>
    );
}

export default ReactRouter;