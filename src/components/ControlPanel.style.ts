import { makeStyles } from "@material-ui/core";

export const useStyles = makeStyles(() => ({
    root: {
        width: '100%',
        height: '90vh',
    },

    container: {

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
        minHeight: '50vh',
        maxHeight: 'min(660px, 90vh)',
        overflowY: "scroll",
        scrollSnapType: 'y mandatory',
        scrollPadding: '1ch',
    },

    logCard: {
        scrollSnapAlign: 'end',
    },

    settings: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2ch',
    }
}));