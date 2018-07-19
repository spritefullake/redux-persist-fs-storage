/* @flow */
import fs from 'react-native-fs';

import {
    FileSystem
} from 'expo';

export const DocumentDir = FileSystem.documentDirectory;
export const CacheDir = FileSystem.cacheDirectory;

const resolvePath = (...paths: Array < string > ) =>
    '/' +
    paths
    .join('/')
    .split('/')
    .filter(part => part && part !== '.')
    .join('/');

// Wrap function to support both Promise and callback
async function withCallback < R > (
    callback ? : ? (error: ? Error, result : R | void) => void,
    func : () => Promise < R > ,
): Promise < R | void > {
    try {
        const result = await func();
        if (callback) {
            callback(null, result);
        }
        return result;
    } catch (err) {
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
    }
}

const FSStorage = (
    location ? : string = DocumentDir,
    folder ? : string = 'reduxPersist',
) => {
    const baseFolder = resolvePath(location, folder);

    const pathForKey = (key: string) =>
        resolvePath(baseFolder, encodeURIComponent(key));

    const setItem = (
            key: string,
            value: string,
            callback ? : ? (error: ? Error) => void,
        ): Promise < void > =>
        withCallback(callback, async () => {
            await FileSystem.makeDirectoryAsync(baseFolder);
            await FileSystem.writeAsStringAsync(pathForKey(key), value, 'utf8');
        });

    const getItem = (
            key: string,
            callback ? : ? (error: ? Error, result : ? string) => void,
        ): Promise << ? string > =>
        withCallback(callback, async () => {
            if ((await FileSystem.getInfoAsync(pathForKey(key))).exists) {
                const data = await FileSystem.readAsStringAsync(pathForKey(key));
                return data;
            }
        });

    const removeItem = (
            key: string,
            callback ? : ? (error: ? Error) => void,
        ): Promise < void > =>
        withCallback(callback, async () => {
            if ((await FileSystem.getInfoAsync(pathForKey(key))).exists) {
                await FileSystem.deleteAsync(pathForKey(key), {
                    //avoid throwing errors
                    idempotent: true,
                })
            }
        });

    //no longer required to define  
    //#getAllKeys for redux-persist

    return {
        setItem,
        getItem,
        removeItem,
    };
};

export default FSStorage;