pipeline {
    agent any
    
    tools {
        nodejs 'Node20'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
    }

    environment {
        EC2_IP = credentials('EC2_IP_CREDENTIAL')
        SSH_USER = credentials('SSH_USER_CREDENTIAL')
        APP_DIR = credentials('APP_DIR_CREDENTIAL')
        NODE_ENV = 'production'
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/benacton/nextjs-blog.git'
            }
        }

        stage('Setup Project') {
            steps {
                sh '''
                    # Clean install
                    rm -rf node_modules package-lock.json
                    
                    # Install all dependencies including dev dependencies
                    npm install
                    
                    # Install Tailwind CSS and its dependencies
                    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
                    
                    # Initialize Tailwind CSS if config doesn't exist
                    if [ ! -f tailwind.config.js ]; then
                        cat > tailwind.config.js << 'EOL'
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL
                    fi
                    
                    # Create PostCSS config
                    cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    # Build the project
                    npm run build
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['jenkins-ec2-key']) {
                    sh '''
                        # Deploy using rsync
                        rsync -avz --exclude 'node_modules' ./ ${SSH_USER}@${EC2_IP}:${APP_DIR}/
                        
                        # Install and start on server
                        ssh ${SSH_USER}@${EC2_IP} "cd ${APP_DIR} && \
                            npm install --production && \
                            pm2 delete nextjs-blog || true && \
                            pm2 start npm --name nextjs-blog -- start && \
                            pm2 save"
                    '''
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