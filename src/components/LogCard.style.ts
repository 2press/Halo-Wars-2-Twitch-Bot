import { makeStyles } from "@material-ui/core";

export const useStyles = makeStyles(() => ({
    root: {
        position: 'relative',
        scrollSnapAlign: 'end',
    },

    actions: {
        position: 'absolute',
        right: '-5px',
        top: '25px',
    },

    stats: {
        margin: '-25px 0px -15px 0px',
    }
}));