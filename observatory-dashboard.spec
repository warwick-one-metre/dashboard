Name:      observatory-dashboard
Version:   2.22.0
Release:   0
Url:       https://github.com/warwick-one-metre/pipelined
Summary:   Data pipeline server for the Warwick one-metre telescope.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
Requires: nginx, nfs-utils, uwsgi, uwsgi-plugin-python36, uwsgi-logger-file, mariadb-server, %{?systemd_requires}
Requires: observatory-log-server, observatory-weather-database-updater
Requires: python3, python3-flask, python3-github-flask, python3-pymysql, python3-warwick-observatory-common

%description
Part of the observatory software for the Warwick La Palma telescopes.

%build

mkdir -p %{buildroot}/srv/dashboard/generated
cp -r %{_sourcedir}/dashboard %{buildroot}/srv/dashboard
cp -r %{_sourcedir}/static %{buildroot}/srv/dashboard
rm -rf %{buildroot}/srv/dashboard/dashboard/__pycache__
%{__install} %{_sourcedir}/dashboard.ini %{buildroot}/srv/dashboard/

mkdir -p %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-data %{buildroot}%{_bindir}

mkdir -p %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/dashboard.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-data.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-data.timer %{buildroot}%{_unitdir}

%{__install} %{_sourcedir}/fetch-nites-webcam.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/fetch-nites-webcam.timer %{buildroot}%{_unitdir}

mkdir -p %{buildroot}/etc/nginx/conf.d/
%{__install} %{_sourcedir}/dashboard.conf %{buildroot}/etc/nginx/conf.d/dashboard.conf

%post
%systemd_post dashboard.service
%systemd_post update-dashboard-data.service
%systemd_post fetch-nites-webcam.service

%preun
%systemd_preun dashboard.service
%systemd_preun update-dashboard-data.service
%systemd_preun fetch-nites-webcam.service

%postun
%systemd_postun_with_restart dashboard.service
%systemd_postun_with_restart update-dashboard-data.service
%systemd_postun_with_restart fetch-nites-webcam.service

%files
%defattr(0744,nginx,nginx,0755)
/srv/dashboard

%defattr(0744,nfsnobody,nfsnobody,0755)
/srv/dashboard/generated

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
%{_unitdir}/update-dashboard-data.service
%{_unitdir}/update-dashboard-data.timer
%{_unitdir}/fetch-nites-webcam.service
%{_unitdir}/fetch-nites-webcam.timer
/etc/nginx/conf.d/dashboard.conf

%{_bindir}/update-dashboard-data

%changelog
