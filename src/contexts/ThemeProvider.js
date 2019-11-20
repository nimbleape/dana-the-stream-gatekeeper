import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme, darken } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { blue, pink } from '@material-ui/core/colors';

const themeInitialOptions = {
    direction: 'ltr',
    paletteColors: {},
};

export const DispatchContext = React.createContext(() => {
    throw new Error('Forgot to wrap component in ThemeContext.Provider');
});

export default function Provider(props) {
    const { children } = props;

    const [themeOptions, dispatch] = React.useReducer((state, action) => {
        switch (action.type) {
            case 'RESET_COLORS':
                return {
                    ...state,
                    paletteColors: themeInitialOptions.paletteColors,
                };
            case 'CHANGE':
                return {
                    paletteType: action.payload.paletteType || state.paletteType,
                    direction: action.payload.direction || state.direction,
                    paletteColors: action.payload.paletteColors || state.paletteColors,
                };
            default:
                throw new Error(`Unrecognized type ${action.type}`);
        }
      }, themeInitialOptions);

    const prefersDarkMode = useMediaQuery('@media (prefers-color-scheme: dark)');
    const preferredType = prefersDarkMode ? 'dark' : 'light';
    const { direction, paletteColors, paletteType = preferredType } = themeOptions;

    const theme = React.useMemo(() => {
        const nextTheme = createMuiTheme({
            direction,
            nprogress: {
                color: paletteType === 'light' ? '#000' : '#fff',
            },
            palette: {
                primary: {
                    main: paletteType === 'light' ? blue[700] : blue[200],
                },
                secondary: {
                    main: paletteType === 'light' ? darken(pink.A400, 0.1) : pink[200],
                },
                type: paletteType,
                background: {
                    default: paletteType === 'light' ? '#fff' : '#121212',
                },
                ...paletteColors,
            },
        });

        nextTheme.palette.background.level2 =
            paletteType === 'light' ? nextTheme.palette.grey[100] : '#333';

        nextTheme.palette.background.level1 =
            paletteType === 'light' ? '#fff' : nextTheme.palette.grey[900];

        return nextTheme;
    }, [direction, paletteColors, paletteType]);

    return (
        <ThemeProvider theme={theme}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </ThemeProvider>
    );
}

Provider.propTypes = {
  children: PropTypes.node,
};

/**
 * @returns {(nextOptions: Partial<typeof themeInitialOptions>) => void}
 */
export function useChangeTheme() {
  const dispatch = React.useContext(DispatchContext);
  return React.useCallback(options => dispatch({ type: 'CHANGE', payload: options }), [dispatch]);
}