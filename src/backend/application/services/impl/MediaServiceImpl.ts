import { inject, injectable } from 'inversify';
import TYPES from '@/backend/ioc/types';
import MediaService from '@/backend/application/services/MediaService';
import { ObjUtil } from '@/backend/utils/ObjUtil';
import path from 'path';
import FfmpegService from '@/backend/application/services/FfmpegService';
import fs from 'fs';
import StorageDirectoryProvider, {
    StorageDirectoryTarget,
} from '@/backend/application/ports/gateways/storage/StorageDirectoryProvider';

@injectable()
export default class MediaServiceImpl implements MediaService {

    @inject(TYPES.StorageDirectoryProvider)
    private storageDirectoryProvider!: StorageDirectoryProvider;

    @inject(TYPES.FfmpegService)
    private ffmpegService!: FfmpegService;


    private async generateThumbnailPath(sourceFilePath: string, timestamp: number, options?: {
        quality?: 'low' | 'medium' | 'high' | 'ultra';
        width?: number;
        format?: 'jpg' | 'png';
    }): Promise<string> {
        const { quality = 'medium', width, format = 'jpg' } = options || {};

        // Create a unique filename based on parameters to avoid caching issues
        const qualitySuffix = quality !== 'medium' ? `-${quality}` : '';
        const widthSuffix = width ? `-w${width}` : '';
        const extension = format === 'png' ? '.png' : '.jpg';

        const thumbnailFileName = ObjUtil.hash(sourceFilePath) + '-' + timestamp + qualitySuffix + widthSuffix + extension;
        const tempDirectory = await this.storageDirectoryProvider.provideDirectory(StorageDirectoryTarget.TEMP);
        return path.join(tempDirectory, thumbnailFileName);
    }

    /**
     * 获取缩略图临时目录。
     * @returns 已确保存在的临时目录。
     */
    private async getTempDirectoryPath(): Promise<string> {
        return this.storageDirectoryProvider.provideDirectory(StorageDirectoryTarget.TEMP);
    }

    async thumbnail(sourceFilePath: string, timestamp?: number, options?: {
        quality?: 'low' | 'medium' | 'high' | 'ultra';
        width?: number;
        format?: 'jpg' | 'png';
    }): Promise<string> {
        await this.storageDirectoryProvider.ensurePathAccessPermissionIfExists(sourceFilePath);
        if (!fs.existsSync(sourceFilePath)) {
            return '';
        }
        const duration = await this.ffmpegService.duration(sourceFilePath);
        const adjustedTimestamp = this.calculateAdjustedTimestamp(timestamp, duration);
        const tempDirectoryPath = await this.getTempDirectoryPath();
        const thumbnailPath = await this.generateThumbnailPath(sourceFilePath, adjustedTimestamp, options);

        if (fs.existsSync(thumbnailPath)) {
            return thumbnailPath;
        }

        await this.ffmpegService.thumbnail({
            inputFile: sourceFilePath,
            outputFolder: tempDirectoryPath,
            outputFileName: path.basename(thumbnailPath),
            time: adjustedTimestamp,
            inputDuration: duration,
            options: options || {}
        });

        return thumbnailPath;
    }

    private calculateAdjustedTimestamp(timestamp: number | undefined, duration: number) {
        let adjustedTimestamp = timestamp ? timestamp : duration / 2;
        adjustedTimestamp = Math.min(Math.max(adjustedTimestamp, 0), duration);

        // 计算所在的15秒区间索引
        const intervalIndex = Math.floor(adjustedTimestamp / 15);

        // 计算区间中间值：区间起始点 + 7秒 (整数)
        const intervalMiddle = intervalIndex * 15 + 7;

        // 确保不超过duration范围，并且留出1秒的缓冲
        return Math.min(intervalMiddle, Math.floor(duration) - 1);
    }


    async duration(inputFile: string): Promise<number> {
        await this.storageDirectoryProvider.ensurePathAccessPermissionIfExists(inputFile);
        if (!fs.existsSync(inputFile)) {
            return 0;
        }
        return this.ffmpegService.duration(inputFile);
    }
}
