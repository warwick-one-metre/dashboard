Enable opensuse server repository: http://download.opensuse.org/repositories/server:/http/openSUSE_Leap_42.1/
Open port 80 in the firewall by setting `FW_SERVICES_EXT_TCP="80"` in /etc/sysconfig/SuSEfirewall2

```
sudo systemctl enable dashboard
sudo systemctl enable update-dashboard-data
```

To start immediately:
```
sudo systemctl start dashboard
sudo systemctl start update-dashboard-data
``
