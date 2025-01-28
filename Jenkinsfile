pipeline {
    agent any
    
    tools {
        nodejs 'Node20'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    environment {
        EC2_IP = credentials('EC2_IP_CREDENTIAL')
        SSH_USER = credentials('SSH_USER_CREDENTIAL')
        APP_DIR = credentials('APP_DIR_CREDENTIAL')
        NODE_ENV = 'production'
        SSH_OPTS = '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
        BACKUP_DIR = '/home/ubuntu/app_backups'
    }

    stages {
        stage('Clone Repository') {
            steps {
                script {
                    try {
                        echo 'Cloning repository...'
                        git branch: 'main', 
                            url: 'https://github.com/benacton/nextjs-blog.git'
                    } catch (Exception e) {
                        error "Failed to clone repository: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    try {
                        echo 'Installing dependencies...'
                        sh '''
                            npm cache clean --force
                            rm -rf node_modules package-lock.json
                            npm install
                        '''
                    } catch (Exception e) {
                        error "Failed to install dependencies: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Verify TailwindCSS Setup') {
            steps {
                script {
                    try {
                        echo 'Verifying TailwindCSS installation...'
                        sh '''
                            npm install -D tailwindcss postcss autoprefixer
                            npx tailwindcss init -p
                        '''
                    } catch (Exception e) {
                        error "Failed to verify TailwindCSS: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    try {
                        echo 'Building the project...'
                        sh '''
                            echo "Node version: $(node -v)"
                            echo "NPM version: $(npm -v)"
                            echo "Current directory: $(pwd)"
                            echo "Directory contents:"
                            ls -la
                            echo "Package.json contents:"
                            cat package.json
                            
                            # Set NODE_ENV
                            export NODE_ENV=production
                            
                            # Build the project with detailed output
                            npm run build || {
                                echo "Build failed. Checking for errors..."
                                exit 1
                            }
                        '''
                    } catch (Exception e) {
                        echo "Build error details: ${e.getMessage()}"
                        error "Build stage failed. Check the logs above for details."
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    try {
                        sshagent(credentials: ['jenkins-ec2-key']) {
                            sh """
                                # Test SSH connection
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "echo 'SSH connection successful'"
                                
                                # Create directory and clean it
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "mkdir -p ${env.APP_DIR} && rm -rf ${env.APP_DIR}/*"
                                
                                # Copy files
                                rsync -avz --exclude 'node_modules' ./ ${env.SSH_USER}@${env.EC2_IP}:${env.APP_DIR}/
                                
                                # Install and start
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "cd ${env.APP_DIR} && \
                                    npm install --production && \
                                    pm2 delete nextjs-blog || true && \
                                    pm2 start npm --name nextjs-blog -- start && \
                                    pm2 save"
                            """
                        }
                    } catch (Exception e) {
                        error "Deployment failed: ${e.getMessage()}"
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}