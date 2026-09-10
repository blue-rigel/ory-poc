To make **any `*.test` domain point to your Mac**, set up dnsmasq once.

1. **Install dnsmasq** (requires [Homebrew](https://brew.sh/)):

   ```bash
   brew install dnsmasq
   ```

2. **Open its configuration:**

   ```bash
   sudo nano "$(brew --prefix)/etc/dnsmasq.conf"
   ```

   Add these lines at the bottom:

   ```ini
   address=/test/127.0.0.1
   local=/test/
   listen-address=127.0.0.1
   bind-interfaces
   ```

   Save with **Ctrl+O**, **Enter**, then **Ctrl+X**. The address rule covers all `.test` subdomains; `local` keeps other `.test` queries local. [dnsmasq documentation](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html)

3. **Tell macOS to use dnsmasq for `.test`:**

   ```bash
   sudo mkdir -p /etc/resolver
   echo 'nameserver 127.0.0.1' | sudo tee /etc/resolver/test
   ```

4. **Start dnsmasq and refresh DNS:**

   ```bash
   sudo "$(command -v brew)" services restart dnsmasq
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

5. **Verify:**

   ```bash
   dscacheutil -q host -a name app.test
   ```

   You should see `127.0.0.1`.

Now an app running on port `3000` can be accessed at **`http://app.test:3000`**, **`http://api.test:3000`**, or **`http://anything.app.test:3000`**.

Your app must accept the hostname. HTTPS requires a separate local certificate setup.


