# BinaryLane Deployment Research Notes

## Verified provider capabilities

BinaryLane's standard Linux VPS service lists Sydney availability, Ubuntu support, full root access over SSH, external firewall controls, configurable resources, IPv4/IPv6 connectivity, and optional automated backups. Its current listed standard 4 GB plan is **2 vCPU, 4 GB memory, 60 GB NVMe storage, and 3 TB data transfer** for **A$19.60/month**, billed hourly in arrears. [1]

BinaryLane advises VPS customers to use its external firewall, minimise exposed ports, patch operating systems, restrict SSH access, and monitor logs. Its VPS backups are an additional service; they are stored separately in the same data centre and are not encrypted at rest, with optional offsite copying available. [2] [3]

## Deployment implications for SponsorBridge

The initial stack should run Docker Compose on a Sydney VPS with Caddy serving HTTPS, the SponsorBridge app, and MySQL. New uploads should use portable S3-compatible object storage rather than VPS disk. Automated encrypted offsite database backups and application-level encryption for sensitive data remain necessary.

## References

[1]: [BinaryLane — Linux VPS](https://www.binarylane.com.au/vps-hosting/linux-vps)
[2]: [BinaryLane — Securing your servers](https://support.binarylane.com.au/support/solutions/articles/11000128211-securing-your-servers)
[3]: [BinaryLane — Automated backups](https://support.binarylane.com.au/support/solutions/articles/11000033794-automated-backups)
