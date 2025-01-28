pipeline {
    agent any

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                    args '-u node' // Run as the 'node' user inside the container
                }
            }
            steps {
                sh '''
                # Set npm cache directory to avoid permission issues
                export NPM_CONFIG_CACHE=$(pwd)/.npm

                # Verify environment
                ls -la
                whoami
                node --version
                npm --version

                # Install dependencies and build
                npm ci
                npm run build

                # Verify output
                ls -la
                '''
            }
        }
    }
}
