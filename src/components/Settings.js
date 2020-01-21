import React, {Fragment} from 'react';
import { withContext } from '../contexts/AppContext';
import { makeStyles } from '@material-ui/core/styles';
import { Avatar, IconButton, Button, TextField, Typography, Container } from '@material-ui/core';
import { ArrowBack as BackIcon, LockOutlined as LockOutlinedIcon } from '@material-ui/icons';
import Footer from './Footer';
import TopBar from './TopBar';

const useStyles = makeStyles(theme => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

function Settings(props) {

    let { history, dispatch, serverWssUri, sipUri, password, name, mqttUri, dontShowSettings } = props;
    const classes = useStyles();

    const handleChange = (event) => {
        let ACTION_NAME;
        switch(event.target.name) {
            case 'uri':
                ACTION_NAME = 'UPDATE_WSS_ADDRESS';
                break;
            case 'sipUri':
                ACTION_NAME = 'UPDATE_SIP_URI';
                break;
            case 'password':
                ACTION_NAME = 'UPDATE_PASSWORD';
                break;
            case 'name':
                ACTION_NAME = 'UPDATE_NAME';
                break;
            case 'mqttUri':
                ACTION_NAME = 'UPDATE_MQTT_URI';
                break;
            default:
                    break;
        }
        dispatch({ type: ACTION_NAME, data: event.target.value});
    };

    return (
        <Fragment>
            <TopBar>
                <IconButton edge="end" color="inherit" aria-label="Settings"  onClick={() => history.goBack()}>
                    <BackIcon />
                </IconButton>
            </TopBar>
            <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Settings
                    </Typography>
                    <form className={classes.form} noValidate onSubmit={() => {
                        history.push('/');
                    }}>

                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Name"
                            name="name"
                            autoFocus
                            value={name}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="uri"
                            label="Server URI"
                            name="uri"
                            disabled={dontShowSettings}
                            value={serverWssUri}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="sipUri"
                            label="SIP URI"
                            name="sipUri"
                            disabled={dontShowSettings}
                            value={sipUri}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            disabled={dontShowSettings}
                            autoComplete="current-password"
                            value={password}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            name="mqttUri"
                            label="MQTT WSS URI"
                            id="mqttUri"
                            disabled={dontShowSettings}
                            value={mqttUri}
                            onChange={handleChange}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Finish
                        </Button>
                    </form>
                </div>
            </Container>
            <Footer />
        </Fragment>
    );
}

export default withContext(Settings);