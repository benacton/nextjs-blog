pipeline {
    agent any

    environment {
        EC2_IP = credentials('EC2_IP_CREDENTIAL')     // Fetch EC2 IP from Jenkins credentials
        SSH_USER = credentials('SSH_USER_CREDENTIAL') // Fetch SSH username from Jenkins credentials
        APP_DIR = credentials('APP_DIR_CREDENTIAL')   // Fetch app directory from Jenkins credentials
        NODE_ENV = 'production'                       // Node.js environment
    }

    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/benacton/nextjs-blog.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                script {
                    def nodejs = tool name: 'Node20', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodejs}/bin:${env.PATH}"
                    // Ensure both devDependencies and dependencies are installed
                    sh 'npm install'
                }
            }
        }

        stage('Verify TailwindCSS Setup') {
            steps {
                echo 'Verifying TailwindCSS is installed...'
                script {
                    // Reinstall tailwindcss in case of issues
                    sh 'npm install tailwindcss postcss autoprefixer'
                }
            }
        }

        stage('Build') {
            steps {
                echo 'Building the project...'
                sh 'npm run build' // Builds your Next.js app
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo 'Deploying application to EC2...'
                sshagent(credentials: ['jenkins-ec2-key']) {
                    sh """
                    # Connect to EC2 instance and prepare the app directory
                    ssh -o StrictHostKeyChecking=no $SSH_USER@$EC2_IP << EOF
                    mkdir -p $APP_DIR
                    rm -rf $APP_DIR/*
                    exit
EOF
                    # Copy project files to EC2 (excluding node_modules)
                    rsync -av --exclude='node_modules' ./ $SSH_USER@$EC2_IP:$APP_DIR

                    # Connect to EC2 and install production dependencies
                    ssh $SSH_USER@$EC2_IP << EOF
                    cd $APP_DIR
                    npm install --omit=dev
                    pm2 delete nextjs-blog || true
                    pm2 start npm --name nextjs-blog -- start
                    pm2 save
                    exit
EOF
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
