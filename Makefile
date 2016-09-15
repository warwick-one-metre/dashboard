RPMBUILD = rpmbuild --define "_topdir %(pwd)/build" \
        --define "_builddir %{_topdir}" \
        --define "_rpmdir %{_topdir}" \
        --define "_srcrpmdir %{_topdir}" \
        --define "_sourcedir %(pwd)"

# Need to create config.py manually, with keys for:
# SECRET_KEY = <random string of data>
# GITHUB_KEY = <from github oauth configuration page>
# GITHUB_SECRET = <from github oauth configuration page>
all: config.py
	mkdir -p build
	${RPMBUILD} -ba dashboard.spec
	mv build/noarch/*.rpm .
	rm -rf build

