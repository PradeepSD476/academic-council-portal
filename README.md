### academic-council-portal  

### Steps to setup the linux environment and clone this repo on your local machine  
_we will be using wsl (windows subsystem for linux) to ensure that we have consistent development environment_  

### Install Wsl for windows  
_Open PowerShell as an Administrator_  
run cmd: wsl --install  
Restart your computer when prompted. This will install WSL and a default Ubuntu distribution.  

### Clone this project into WSL  
_open your ubuntu terminal from start menu_  
_1. clone this repo using cmd: 'git clone https://github.com/PradeepSD476/academic-council-portal.git'_  

_2. navigate into the project folder: cd academic-council-portal_  

### Install the dependencies  
_1. for client: cd client and then npm install_  
_2. for server: cd server and then npm install_  

### Open in vs code  
IMP: you must have vs code installed and the extensions 'WSL' and 'Remote Development' installed in vs code , if not installed first install them and close vs code  
_use command 'code .' from the projects root folder_  
_this will open vs code with correctly connected to your wsl environment_  
