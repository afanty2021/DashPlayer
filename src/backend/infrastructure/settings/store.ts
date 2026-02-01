import Store from 'electron-store';
import {SettingKey, SettingKeyObj} from '@/common/types/store_schema';
import StrUtil from '@/common/utils/str-util';


const store = new Store();

export const storeSet = (key: SettingKey, value: string | undefined | null): boolean => {
    // 将值转换为字符串，避免布尔值导致的 trim 错误
    let stringValue = value;
    if (typeof value === 'boolean') {
        stringValue = value.toString();
    } else if (value === null || value === undefined) {
        stringValue = '';
    }

    if (StrUtil.isBlank(stringValue)) {
        stringValue = SettingKeyObj[key];
    }
    const oldValue = store.get(key, SettingKeyObj[key]);
    if (oldValue === stringValue) {
       return false;
    }
    store.set(key, stringValue);
    return true;
};

export const storeGet = (key: SettingKey): string => {
    return store.get(key, SettingKeyObj[key]) as string;
}
