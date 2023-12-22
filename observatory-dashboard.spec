Name:      observatory-dashboard
Version:   20230205
Release:   0
Url:       https://github.com/warwick-one-metre/dashboard
Summary:   Web dashboard for the Warwick La Palma telescopes.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
Requires:  nginx nfs-utils uwsgi uwsgi-plugin-python3 uwsgi-logger-file mariadb-server
Requires:  observatory-log-server observatory-weather-database-updater
Requires:  python3 python3-flask python3-github-flask python3-warwick-observatory-common

%description

%build

mkdir -p %{buildroot}/srv/dashboard/generated
cp -r %{_sourcedir}/dashboard %{buildroot}/srv/dashboard
cp -r %{_sourcedir}/static %{buildroot}/srv/dashboard
rm -rf %{buildroot}/srv/dashboard/dashboard/__pycache__
%{__install} %{_sourcedir}/dashboard.ini %{buildroot}/srv/dashboard/

mkdir -p %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-data %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-overview %{buildroot}%{_bindir}
%{__install} %{_sourcedir}/update-dashboard-webcams %{buildroot}%{_bindir}

mkdir -p %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/dashboard.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-data.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-overview.service %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/update-dashboard-webcams.service %{buildroot}%{_unitdir}

mkdir -p %{buildroot}/etc/nginx/conf.d/
%{__install} %{_sourcedir}/dashboard.conf %{buildroot}/etc/nginx/conf.d/dashboard.conf

%files
%defattr(0744,nginx,nginx,0755)
/srv/dashboard
/srv/dashboard/generated

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
%{_unitdir}/update-dashboard-data.service
%{_unitdir}/update-dashboard-overview.service
%{_unitdir}/update-dashboard-webcams.service
%{_bindir}/update-dashboard-data
%{_bindir}/update-dashboard-overview
%{_bindir}/update-dashboard-webcams
/etc/nginx/conf.d/dashboard.conf

%changelog
