pipeline {
    agent any

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                    args '-u node' // Use the "node" user inside the container
                }
            }
            steps {
                sh '''
                # Verify environment
                whoami
                pwd
                ls -la

                # Set npm cache to avoid permission issues
                export NPM_CONFIG_CACHE=$(pwd)/.npm

                # Install dependencies and build
                npm ci
                npm run build

                # List files after build
                ls -la
                '''
            }
        }
    }
}
