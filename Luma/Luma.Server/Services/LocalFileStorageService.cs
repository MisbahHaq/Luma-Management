using Microsoft.Extensions.Options;

namespace Luma.Server.Services;

public class LocalStorageOptions
{
    public string RootPath { get; set; } = "uploads";
}

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;

    public LocalFileStorageService(IOptions<LocalStorageOptions> options)
    {
        _root = Path.Combine(AppContext.BaseDirectory, options.Value.RootPath);
        Directory.CreateDirectory(_root);
    }

    public async Task<string> UploadAsync(string fileName, string contentType, Stream content, CancellationToken ct = default)
    {
        var objectKey = $"{Guid.NewGuid()}_{Sanitize(fileName)}";
        var path = Path.Combine(_root, objectKey);
        await using var fs = File.Create(path);
        await content.CopyToAsync(fs, ct);
        return objectKey;
    }

    public async Task<(Stream Content, string ContentType, string FileName)> DownloadAsync(string objectKey, CancellationToken ct = default)
    {
        var path = Path.Combine(_root, objectKey);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Attachment not found.", objectKey);
        }

        var memory = new MemoryStream();
        await using (var fs = File.OpenRead(path))
        {
            await fs.CopyToAsync(memory, ct);
        }
        memory.Position = 0;
        return (memory, "application/octet-stream", Path.GetFileName(objectKey));
    }

    public Task DeleteAsync(string objectKey, CancellationToken ct = default)
    {
        var path = Path.Combine(_root, objectKey);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
        return Task.CompletedTask;
    }

    private static string Sanitize(string fileName) =>
        string.Concat((fileName ?? "file").Select(c => char.IsLetterOrDigit(c) || c == '.' || c == '-' || c == '_' ? c : '_'));
}
