-- Security audit finding: applicant-videos had a server-enforced type/size
-- limit, but contracts and bonus-evidence did not — only the client-side
-- <input accept> hint, which anyone can bypass by uploading directly. Both
-- buckets only ever receive images in practice (a rendered signature PNG,
-- and phone screenshots), so restrict them to that at the storage layer.
update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['image/png']
  where id = 'contracts';
update storage.buckets set file_size_limit = 15728640, allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/heic']
  where id = 'bonus-evidence';
