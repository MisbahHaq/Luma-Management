namespace Luma.Server.Services;

public interface IFileStorageService
{
    Task<string> UploadAsync(string fileName, string contentType, Stream content, CancellationToken ct = default);
    Task<(Stream Content, string ContentType, string FileName)> DownloadAsync(string objectKey, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, CancellationToken ct = default);
}
