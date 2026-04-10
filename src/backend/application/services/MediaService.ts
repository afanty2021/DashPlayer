export default interface MediaService {
    thumbnail(inputFile: string, time?: number, options?: {
        quality?: 'low' | 'medium' | 'high' | 'ultra';
        width?: number;
        format?: 'jpg' | 'png';
    }): Promise<string>;
    duration(inputFile: string): Promise<number>;
}
