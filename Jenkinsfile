pipeline {
    agent any
    
    // Define tools
    tools {
        nodejs 'Node20'
    }

    // Pipeline options
    options {
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '5'))
        cleanWs()
    }

    // Environment variables
    environment {
        EC2_IP = credentials('EC2_IP_CREDENTIAL')
        SSH_USER = credentials('SSH_USER_CREDENTIAL')
        APP_DIR = credentials('APP_DIR_CREDENTIAL')
        NODE_ENV = 'production'
        SSH_OPTS = '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
        BACKUP_DIR = '/home/ubuntu/app_backups'
    }

    stages {
        // Validation Stage
        stage('Validate Environment') {
            steps {
                script {
                    // Check if all required credentials are available
                    if (!env.EC2_IP?.trim() || !env.SSH_USER?.trim() || !env.APP_DIR?.trim()) {
                        error "Missing required credentials"
                    }
                    
                    // Verify Node.js installation
                    sh '''
                        echo "Node version: $(node --version)"
                        echo "NPM version: $(npm --version)"
                    '''
                }
            }
        }

        // Clone Repository Stage
        stage('Clone Repository') {
            steps {
                script {
                    try {
                        echo 'Cloning repository...'
                        git branch: 'main', 
                            url: 'https://github.com/benacton/nextjs-blog.git',
                            changelog: true
                    } catch (Exception e) {
                        error "Failed to clone repository: ${e.getMessage()}"
                    }
                }
            }
        }

        // Install Dependencies Stage
        stage('Install Dependencies') {
            steps {
                script {
                    try {
                        echo 'Installing dependencies...'
                        // Use npm ci for clean installs
                        sh '''
                            if [ -d node_modules ]; then
                                echo "Using cached node_modules"
                                npm install
                            else
                                npm ci
                            fi
                        '''
                    } catch (Exception e) {
                        error "Failed to install dependencies: ${e.getMessage()}"
                    }
                }
            }
        }

        // Security Audit Stage
        stage('Security Audit') {
            steps {
                script {
                    try {
                        echo 'Running security audit...'
                        sh 'npm audit'
                    } catch (Exception e) {
                        // Don't fail the build, but warn about security issues
                        warning "Security audit found issues: ${e.getMessage()}"
                    }
                }
            }
        }

        // Verify TailwindCSS Stage
        stage('Verify TailwindCSS Setup') {
            steps {
                script {
                    try {
                        echo 'Verifying TailwindCSS installation...'
                        sh 'npm install tailwindcss postcss autoprefixer'
                    } catch (Exception e) {
                        error "Failed to verify TailwindCSS: ${e.getMessage()}"
                    }
                }
            }
        }

        // Build Stage
        stage('Build') {
            steps {
                script {
                    try {
                        echo 'Building the project...'
                        sh 'npm run build'
                    } catch (Exception e) {
                        error "Build failed: ${e.getMessage()}"
                    }
                }
            }
        }

        // Pre-deployment Check Stage
        stage('Pre-deployment Check') {
            steps {
                script {
                    try {
                        echo 'Testing SSH connection...'
                        sshagent(credentials: ['jenkins-ec2-key']) {
                            sh """
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} 'echo "SSH connection successful"'
                            """
                        }
                    } catch (Exception e) {
                        error "Pre-deployment check failed: ${e.getMessage()}"
                    }
                }
            }
        }

        // Backup Stage
        stage('Backup') {
            steps {
                script {
                    try {
                        echo 'Creating backup...'
                        sshagent(credentials: ['jenkins-ec2-key']) {
                            sh """
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "
                                    mkdir -p ${env.BACKUP_DIR}
                                    if [ -d ${env.APP_DIR} ]; then
                                        timestamp=\$(date +%Y%m%d_%H%M%S)
                                        cp -r ${env.APP_DIR} ${env.BACKUP_DIR}/backup_\${timestamp}
                                        echo 'Backup created successfully'
                                    fi
                                "
                            """
                        }
                    } catch (Exception e) {
                        warning "Backup failed but continuing deployment: ${e.getMessage()}"
                    }
                }
            }
        }

        // Deploy Stage
        stage('Deploy to EC2') {
            steps {
                script {
                    try {
                        echo 'Deploying application to EC2...'
                        sshagent(credentials: ['jenkins-ec2-key']) {
                            sh """
                                # Verify SSH connectivity
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "echo 'Starting deployment...'"

                                # Prepare app directory
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "
                                    mkdir -p ${env.APP_DIR}
                                    rm -rf ${env.APP_DIR}/*
                                "

                                # Copy project files
                                rsync -avz --exclude='node_modules' --exclude='.git' \
                                    -e "ssh ${env.SSH_OPTS}" \
                                    ./ ${env.SSH_USER}@${env.EC2_IP}:${env.APP_DIR}/

                                # Setup and start application
                                ssh ${env.SSH_OPTS} ${env.SSH_USER}@${env.EC2_IP} "
                                    cd ${env.APP_DIR}
                                    npm install --omit=dev
                                    pm2 delete nextjs-blog || true
                                    pm2 start npm --name nextjs-blog -- start
                                    pm2 save
                                "
                            """
                        }
                    } catch (Exception e) {
                        error "Deployment failed: ${e.getMessage()}"
                    }
                }
            }
        }

        // Health Check Stage
        stage('Health Check') {
            steps {
                script {
                    try {
                        echo 'Performing health check...'
                        sh """
                            # Wait for application to start
                            sleep 10
                            # Check if application is responding
                            curl -f http://${env.EC2_IP}:3000 || exit 1
                        """
                    } catch (Exception e) {
                        error "Health check failed: ${e.getMessage()}"
                    }
                }
            }
        }
    }

    // Post-build actions
    post {
        success {
            echo 'Deployment successful!'
            // You can add Slack notifications here if needed
            // slackSend(color: 'good', message: "Deployment successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
        failure {
            echo 'Deployment failed!'
            // slackSend(color: 'danger', message: "Deployment failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
        always {
            cleanWs()
        }
    }
}