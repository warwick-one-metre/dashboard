## La Palma observatory dashboard [![Travis CI build status](https://travis-ci.org/warwick-one-metre/dashboard.svg?branch=master)](https://travis-ci.org/warwick-one-metre/dashboard)

Part of the observatory software for the Warwick La Palma telescopes.

A Flask application that hosts dashboards showing the current / historical weather, webcams / audio, and telescope-specific information.

See [Software Infrastructure](https://github.com/warwick-one-metre/docs/wiki/Software-Infrastructure) for an overview of the W1m software architecture and instructions for developing and deploying the code.

### Software Setup

Installing `observatory-dashboard` will pull in the `nginx` web server, `uwsgi` application container service, and the [weather database updater](https://github.com/warwick-one-metre/weatherlogd/) and [observatory log](https://github.com/warwick-one-metre/obslogd) daemons.

The first step should be to configure the database as described in the `weatherlogd` and `obslogd` repository READMEs.

The web dashboard requires two additional tables in the `ops` database, which can be created using:

```sql
CREATE TABLE `dashboard_config` (
  `id` int(11) NOT NULL,
  `keyname` text NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dashboard_sessions` (
  `github_token` VARCHAR(40) UNIQUE,
  `data` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

```

The `dashboard_config` table is expected to contain three rows:

| `id` | `keyname`    | Description    |
| ---- | ------------ | -------------- |
| `1`  | `SECRET_KEY` | A complex random value used for encrypting cookies and other data.  This should be a string of at least 40 random characters.|
| `2`  | `GITHUB_KEY` | Part of the GitHub authentication support.  This should be set to the "Client ID" listed in the "Warwick one-metre telescope" OAuth App in the organization settings on GitHub. |
| `3`  | `GITHUB_SECRET` | Part of the GitHub authentication support.  This should be set to the "Client Secret" listed in the "Warwick one-metre telescope" OAuth App in the organization settings on GitHub. |


Once that is working, you can configure the dashboard and web-serving infrastructure to run at startup using:
```
sudo systemctl enable nginx uwsgi dashboard update-dashboard-data
```

They can then be started immediately (without waiting for a reboot) using:
```
sudo systemctl start nginx uwsgi dashboard update-dashboard-data
```

Next, allow access through the firewall:
```
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
```

We then need to convince SELinux to let nginx talk to the dashboard:

```
sudo yum install policycoreutils-python
sudo semanage fcontext -at httpd_sys_rw_content_t "/srv/dashboard(/.*)?"
sudo restorecon -Rv /srv/dashboard
```

Now we need to share the temp data directory so that the pipeline daemon (on the TCS) can write preview data.
Edit `/etc/exports` and add the following line:
```
/srv/dashboard/generated    10.2.6.203(rw,sync,no_root_squash,no_all_squash)
```

Note that this is the IP of the machine running `pipelined` and should be updated if that changes.

Next enable the NFS daemons:
```
sudo systemctl enable rpcbind
sudo systemctl enable nfs-server
sudo systemctl enable nfs-lock
sudo systemctl enable nfs-idmap
```
and `systemctl start` them or reboot.

Finally, allow NFS connections through the firewall:
```
sudo firewall-cmd --permanent --zone=public --add-service=nfs
sudo firewall-cmd --permanent --zone=public --add-service=mountd
sudo firewall-cmd --permanent --zone=public --add-service=rpc-bind
sudo firewall-cmd --reload
```

The nginx configuration (`dashboard.conf`) explicitly defines the IP of the hosting machine (currently `10.2.6.100`).
If the machine/ip changes then this should be updated to match.

The GitHub team IDs used to determine permissions are set in the `get_user_account` function in `dashboard/__init__.py`.
The IDs can be queried from the GitHub API with `curl -H "Authorization: token <personal access token>" https://api.github.com/orgs/warwick-one-metre/teams`.  The `<personal access token>` can be generated from your GitHub settings, and should have at least the `repo` scope.

The dashboard URL is also set in the "Authorization callback URL" in the GitHub settings.  If the dashboard is moved then this should be updated to match.

If you want to export / backup the database you must add the `--skip-tz-utc` argument to `mysqldump` to prevent it from breaking timestamps!
