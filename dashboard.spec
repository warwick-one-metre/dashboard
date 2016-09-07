Name:      onemetre-dashboard
Version:   1.0
Release:   0
Url:       https://github.com/warwick-one-metre/pipelined
Summary:   Data pipeline server for the Warwick one-metre telescope.
License:   GPL-3.0
Group:     Unspecified
BuildArch: noarch
Requires:  nginx, python3, python3-Flask, uwsgi, uwsgi-python3, %{?systemd_requires}
BuildRequires: systemd-rpm-macros

%description
Part of the observatory software for the Warwick one-meter telescope.

%build

mkdir -p %{buildroot}/srv/dashboard
%{__install} %{_sourcedir}/dashboard.py %{buildroot}/srv/dashboard/
%{__install} %{_sourcedir}/dashboard.ini %{buildroot}/srv/dashboard/
cp -r %{_sourcedir}/static %{buildroot}/srv/dashboard/
cp -r %{_sourcedir}/templates %{buildroot}/srv/dashboard/

mkdir -p %{buildroot}%{_unitdir}
%{__install} %{_sourcedir}/dashboard.service %{buildroot}%{_unitdir}

mkdir -p %{buildroot}/etc/nginx/conf.d/
%{__install} %{_sourcedir}/dashboard.conf %{buildroot}/etc/nginx/conf.d/dashboard.conf

%pre
%service_add_pre dashboard.service

%post
%service_add_post dashboard.service

%preun
%stop_on_removal dashboard.service
%service_del_preun dashboard.service

%postun
%restart_on_update dashboard.service
%service_del_postun dashboard.service

%files
%defattr(0755,ops,nginx,-)
/srv/dashboard

%defattr(-,root,root,-)
%{_unitdir}/dashboard.service
/etc/nginx/conf.d/dashboard.conf

%changelog
