Name:      observatory-dashboard
Version:   2.10.1
Release:   0
Url:       https://github.com/warwick-one-metre/pipelined
Summary:   Data pipeline server for the Warwick one-metre telescope.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
Requires: nginx, nfs-utils, uwsgi, uwsgi-plugin-python36, uwsgi-logger-file, mariadb-server, %{?systemd_requires}
Requires: observatory-log-server, observatory-weather-database-updater
Requires: python36, python36-Flask, python36-GitHub-Flask, python36-PyMySQL, python36-warwick-observatory-common

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

mkdir -p %{buildroot}/etc/nginx/conf.d/
%{__install} %{_sourcedir}/dashboard.conf %{buildroot}/etc/nginx/conf.d/dashboard.conf

%post
%systemd_post dashboard.service
%systemd_post update-dashboard-data.service

%preun
%systemd_preun dashboard.service
%systemd_preun update-dashboard-data.service

%postun
%systemd_postun_with_restart dashboard.service
%systemd_postun_with_restart update-dashboard-data.service

%files
%defattr(0744,nginx,nginx,0755)
/srv/dashboard

%defattr(0744,nfsnobody,nfsnobody,0755)
/srv/dashboard/generated

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
%{_unitdir}/update-dashboard-data.service
%{_unitdir}/update-dashboard-data.timer
/etc/nginx/conf.d/dashboard.conf

%{_bindir}/update-dashboard-data

%changelog
