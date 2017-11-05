Name:      observatory-dashboard
Version:   2.0.5
Release:   0
Url:       https://github.com/warwick-one-metre/pipelined
Summary:   Data pipeline server for the Warwick one-metre telescope.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
%if 0%{?suse_version}
Requires:  nginx, python3, observatory-log-server, observatory-weather-database-updater, python34-Pyro4, python3-Flask, python3-Flask-OAuthlib, python34-PyMySQL, uwsgi, uwsgi-python3, mariadb, rsync, %{?systemd_requires}
BuildRequires: systemd-rpm-macros
%endif
%if 0%{?centos_ver}
Requires:  nginx, python34, observatory-log-server, observatory-weather-database-updater, python34-Pyro4, python34-Flask, python34-Flask-OAuthlib, python34-PyMySQL, uwsgi, uwsgi-plugin-python3, uwsgi-logger-file, mariadb-server, rsync, %{?systemd_requires}
%endif

%description
Part of the observatory software for the Warwick one-meter telescope.

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

%pre
%if 0%{?suse_version}
%service_add_pre dashboard.service
%service_add_pre update-dashboard-data.service
%endif

%post
%if 0%{?suse_version}
%service_add_post dashboard.service
%service_add_post update-dashboard-data.service
%endif
%if 0%{?centos_ver}
%systemd_post dashboard.service
%systemd_post update-dashboard-data.service
%endif

%preun
%if 0%{?suse_version}
%stop_on_removal dashboard.service
%service_del_preun dashboard.service
%stop_on_removal update-dashboard-data.service
%service_del_preun update-dashboard-data.service
%endif
%if 0%{?centos_ver}
%systemd_preun dashboard.service
%systemd_preun update-dashboard-data.service
%endif

%postun
%if 0%{?suse_version}
%restart_on_update dashboard.service
%service_del_postun dashboard.service
%restart_on_update update-dashboard-data.service
%service_del_postun update-dashboard-data.service
%endif
%if 0%{?centos_ver}
%systemd_postun_with_restart dashboard.service
%systemd_postun_with_restart update-dashboard-data.service
%endif

%files
%defattr(0744,nginx,nginx,0755)
/srv/dashboard

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
%{_unitdir}/update-dashboard-data.service
%{_unitdir}/update-dashboard-data.timer
/etc/nginx/conf.d/dashboard.conf

%{_bindir}/update-dashboard-data

%changelog