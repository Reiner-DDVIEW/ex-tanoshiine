Vagrant.configure(2) do |config|
	config.vm.box = "ubuntu/trusty64"
	config.vm.provision "shell", type: "shell", privileged: false, inline: <<-USER
		echo "Updating virtual machine..."
		export DEBIAN_FRONTEND=noninteractive

        # ffmpeg PPA
        sudo add-apt-repository ppa:mc3man/trusty-media -y
		sudo add-apt-repository ppa:ubuntu-toolchain-r/test -y
		sudo apt-get -qq update        
		sudo apt-get -qq dist-upgrade -y       


    	#echo "Installing dependancies..."
        sudo apt-get -qq install -y ffmpeg build-essential redis-server libopencv-dev\
        	software-properties-common git imagemagick nginx pngquant exiftool gcc-5 g++-5

		sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-5 60 --slave /usr/bin/g++ g++ /usr/bin/g++-5
		cd ~
		curl -O https://storage.googleapis.com/golang/go1.11.1.linux-amd64.tar.gz
 		sudo tar -C /usr/local -xzf go1.11.1.linux-amd64.tar.gz
		mkdir -p ~/go; echo "export GOPATH=$HOME/go" >> ~/.bashrc
		echo "export PATH=$PATH:$HOME/go/bin:/usr/local/go/bin" >> ~/.bashrc

		export GOPATH=$HOME/go
		export PATH=$PATH:$HOME/go/bin:/usr/local/go/bin

		echo "Installing captchouli"
		go get github.com/bakape/captchouli/cmd/captchouli
		
		cd /vagrant
		# cd to tano's root on login
		echo 'cd /vagrant' >> ~/.profile


		echo "Installing npm modules. This will take a while..."
		# Node.js setup script
		wget --user=vagrant -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
		export NVM_DIR="$HOME/.nvm"
		[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
		[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

		nvm install 14.5.0
		cp ./config.js.example ./config.js
		sed -i -e 's/SERVE_STATIC_FILES: false/SERVE_STATIC_FILES: true/' ./config.js
		sed -i -e 's/SERVE_IMAGES: false/SERVE_IMAGES: true/' ./config.js
		cp ./hot.js.example ./hot.js
		cp ./report/config.js.example ./report/config.js
		sed -i -e 's/REPORTS: false/REPORTS: true/' ./report/config.js
		cp ./imager/config.js.example ./imager/config.js
		sed -i -e 's/PNG_THUMBS: false/PNG_THUMBS: true/' ./imager/config.js
		sed -i -e 's/WEBM: false/WEBM: true/' ./imager/config.js
		sed -i -e 's/WEBM_AUDIO: false/WEBM_AUDIO: true/' ./imager/config.js
		sed -i -e 's/SVG: false/SVG: true/' ./imager/config.js
		sed -i -e 's/AUDIOFILES: false/AUDIOFILES: true/' ./imager/config.js
		sed -i -e 's/PDF: false/PDF: true/' ./imager/config.js
		sed -i -e 's/DEL_EXIF: false/DEL_EXIF: true/' ./imager/config.js
		cp ./docs/nginx.conf.example ./docs/nginx.conf
		sed -i -e 's@/path/to/tanoshiine/www@/vagrant/www/@' ./docs/nginx.conf
		sed -i -e 's|location @boards|location /|' ./docs/nginx.conf
		sed -i -e 's/proxy_request_buffering off;//' ./docs/nginx.conf
		sudo cp docs/nginx.conf /etc/nginx/nginx.conf
		sudo service nginx restart

		exit
	USER

	# Server
	config.vm.network :forwarded_port, host: 8000, guest: 8000
	config.vm.network :forwarded_port, host: 8080, guest: 80
	config.vm.network :forwarded_port, host: 80, guest: 80
	config.vm.network :forwarded_port, host: 443, guest: 443

	# Node debug port
	config.vm.network :forwarded_port, host: 5858, guest: 5858

	config.vm.provider "virtualbox" do |v|
		v.customize ["modifyvm", :id, "--nataliasmode1", "proxyonly"]
	end
end
