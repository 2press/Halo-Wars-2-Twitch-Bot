import { makeStyles } from "@material-ui/core";

export const useStyles = makeStyles(() => ({
    root: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: '2ch',
    },

    settingsCard: {
        width: '100%',
    },

    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2ch',
    },

    logsHeader: {
        position: 'sticky',
        top: '0px',
        backgroundColor: 'white',
    },

    logs: {
        width: '50%',
        height: 'calc(100vh - 30px)',
        overflowY: "scroll",
        scrollSnapType: 'y mandatory',
        scrollPadding: '1ch',
    },

    logCard: {
        scrollSnapAlign: 'end',
    },

    settings: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2ch',
    }
}));