import React, {Fragment, useState} from 'react';
import { withContext } from '../contexts/AppContext';
import { Avatar, Button, TextField, Typography, Container, IconButton, Snackbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    Settings as SettingsIcon,
    SettingsInputComponent as SettingsInputComponentIcon,
    LockOutlined as LockOutlinedIcon,
    Close as CloseIcon,
    Error as ErrorIcon
} from '@material-ui/icons';
import TopBar from './TopBar';
import Footer from './Footer';

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
    message: {
        display: 'flex',
        alignItems: 'center',
    },
    icon: {
        fontSize: 20,
        opacity: 0.9,
        marginRight: theme.spacing(1),
    },
}));

function Login(props) {
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    let { history, name, serverWssUri, sipUri, password } = props;
    let roomName = "";

    const onSubmit = (evt) => {
        if(!(name && serverWssUri && sipUri && password)) {
            setOpen(true);
            return evt.preventDefault();
        }

        history.push(`/video/${roomName}`);
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }

        setOpen(false);
    };

    return (
        <Fragment>
            <TopBar>
                <IconButton edge="end" color="inherit" aria-label="Media Settings"  onClick={() => history.push("/media-settings")}>
                    <SettingsInputComponentIcon />
                </IconButton>
                <IconButton edge="end" color="inherit" aria-label="Settings"  onClick={() => history.push("/settings")}>
                    <SettingsIcon />
                </IconButton>
            </TopBar>
            <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <Typography component="h1" variant="h5">
                        Dana - The Stream Gatekeeper
                    </Typography>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h2" variant="h5">
                        Join a Room
                    </Typography>
                    <form className={classes.form} onSubmit={onSubmit}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="roomName"
                            label="Room Name"
                            name="roomName"
                            autoFocus
                            onChange={(event) => {
                                roomName = event.target.value;
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Join
                        </Button>
                    </form>
                </div>
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    open={open}
                    autoHideDuration={6000}
                    onClose={handleClose}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id='message-id' className={classes.message}><ErrorIcon className={classes.icon}/>Missing asterisk server credentials</span>}
                    action={[
                        <Button key="fix" color="secondary" size="small" onClick={() => {
                            history.push("/settings")
                        }}>
                            Fix
                        </Button>,
                        <IconButton
                            key="close"
                            aria-label="close"
                            color="inherit"
                            className={classes.close}
                            onClick={handleClose}
                        >
                            <CloseIcon />
                        </IconButton>,
                    ]}
                />
            </Container>
            <Footer />
        </Fragment>
    );
}

export default withContext(Login);