import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Toolbar, AppBar } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    bar: {
        background: 'transparent',
        boxShadow: 'none'
    },
    root: {
        flexGrow: 1,
    },
    toolbarButtons: {
        marginLeft: 'auto',
        marginRight: -12,
        color: theme.palette.getContrastText(theme.palette.background.paper)
    }
  }));

export default function TopBar(props) {
    const classes = useStyles();

    return (
        <AppBar position="static" className={classes.bar}>
            <Toolbar>
                <span className={classes.toolbarButtons}>
                    {props.children}
                </span>
            </Toolbar>
        </AppBar>
    );
}