using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace Luma.Server.Services;

public class MinioStorageOptions
{
    public string Endpoint { get; set; } = "localhost:9000";
    public string AccessKey { get; set; } = "minioadmin";
    public string SecretKey { get; set; } = "minioadmin";
    public string Bucket { get; set; } = "luma-attachments";
    public bool UseSsl { get; set; } = false;
}

public class MinioStorageService : IFileStorageService
{
    private readonly IMinioClient _client;
    private readonly string _bucket;

    public MinioStorageService(IOptions<MinioStorageOptions> options)
    {
        var o = options.Value;
        _bucket = o.Bucket;
        _client = new MinioClient()
            .WithEndpoint(o.Endpoint)
            .WithCredentials(o.AccessKey, o.SecretKey)
            .WithSSL(o.UseSsl)
            .Build();
    }

    public async Task<string> UploadAsync(string fileName, string contentType, Stream content, CancellationToken ct = default)
    {
        var objectKey = $"{Guid.NewGuid()}/{Sanitize(fileName)}";

        var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucket), ct);
        if (!exists)
        {
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucket), ct);
        }

        await _client.PutObjectAsync(
            new PutObjectArgs()
                .WithBucket(_bucket)
                .WithObject(objectKey)
                .WithStreamData(content)
                .WithObjectSize(content.Length)
                .WithContentType(contentType),
            ct);

        return objectKey;
    }

    public async Task<(Stream Content, string ContentType, string FileName)> DownloadAsync(string objectKey, CancellationToken ct = default)
    {
        var stat = await _client.StatObjectAsync(
            new StatObjectArgs().WithBucket(_bucket).WithObject(objectKey),
            ct);

        var memory = new MemoryStream();
        await _client.GetObjectAsync(
            new GetObjectArgs()
                .WithBucket(_bucket)
                .WithObject(objectKey)
                .WithCallbackStream(stream => stream.CopyTo(memory)),
            ct);
        memory.Position = 0;

        return (memory, stat.ContentType, Path.GetFileName(objectKey));
    }

    public async Task DeleteAsync(string objectKey, CancellationToken ct = default)
    {
        await _client.RemoveObjectAsync(
            new RemoveObjectArgs().WithBucket(_bucket).WithObject(objectKey),
            ct);
    }

    private static string Sanitize(string fileName) =>
        string.Concat((fileName ?? "file").Select(c => char.IsLetterOrDigit(c) || c == '.' || c == '-' || c == '_' ? c : '_'));
}
