import {createMuiTheme} from "../../../web_modules/@material-ui/core/styles.js";
export const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#503185"
    },
    secondary: {
      main: "#FFC100"
    }
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(",")
  }
});
