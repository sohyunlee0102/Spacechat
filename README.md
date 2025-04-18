# AI Translation-enabled Reservation Management Chatbot (Space Chat) Ver. 1 (capstone2 branch)

## 📄 Overview

<aside>
🐰 I was in charge of the backend (Flask) for the AI translation-enabled reservation management chatbot project.
</aside>

## Introduction

With the rising popularity of K-beauty, foreign tourists are coming to Korea for beauty tourism. Among these services, there is an increasing demand for personal color diagnosis services, which help individuals find the colors that suit them best.

Due to the nature of the personal color industry, many small businesses are run by individuals rather than large corporations, and each business has different reservation procedures, which can lead to communication errors and missed reservations. Additionally, during the communication process between businesses and customers, users often have to translate manually or use translation tools. To address these inconveniences, I developed Space Chat, a chatbot with real-time translation and reservation features.

## Key Features

- Reservation functionality via chatbot
- Real-time multilingual translation
- Chatbot implementation based on predicted questions
- CSV download of reservation information and Google Calendar integration
- Real-time communication functionality for administrators

## Distinctiveness from Other Services

- We offer the service as a web application rather than a mobile app to increase accessibility for foreign users. Most foreign tourists wishing to experience personal color diagnosis are on short-term trips to Korea and may have difficulty downloading domestic apps. Based on my own experience as an exchange student, I anticipated this issue and decided to implement a web service to avoid this problem.
- The chatbot is trained with questions specific to personal color diagnosis businesses, enabling smooth Q&A between the chatbot and users. This allows businesses to respond quickly and accurately to frequently asked customer questions, improving customer service quality and reducing labor costs.
- We provide real-time translation services using the DeepL API. Unlike the translation feature in apps like LINE, where a translation bot needs to be invited into the chat, Space Chat translates user messages automatically and shows them in the user’s native language within the chat, allowing true real-time communication without language barriers.

## ⚙️ System Architecture
![image](https://github.com/user-attachments/assets/62b74dee-01dd-4f76-8a8a-e846252e8327)


## 🎨 Design Prototype
![image](https://github.com/user-attachments/assets/4fcc6b00-7696-4e7a-bf54-d0d86262aa28)


## 📜 Database Design
![image](https://github.com/user-attachments/assets/c8974ef9-66ce-4d91-97ff-95764bb1b23e)


## 🖥️ What I did

- Implemented signup and login functionality using RESTful APIs
- Built and managed RDS MySQL database
- Set up and managed EC2 server for service deployment
- Trained and applied a transformer model for predicted customer questions and answers
- Developed "My Page"
- Created an administrator page and implemented 1:1 chat between administrators and customers
- Implemented email verification and reservation details using Gmail IMAP
- Conducted real user testing with both Korean and foreign users

## 📕 Learned

1. This was my first project to officially plan and develop a service. Although there were many challenges and problems, overcoming them helped me significantly improve my development skills.
2. Through the API design process, I gained a deep understanding of RESTful API principles and learned effective data communication methods between the frontend and backend.
3. I expanded my understanding of server setup and management by learning how to switch development ports to HTTP using web servers like Apache.
4. While deploying the service on EC2, I faced CPU overloading issues, but I learned about instance scaling and resizing servers to resolve the problem.
5. I gained troubleshooting experience by analyzing system logs and performing rollback processes, which improved my problem-solving skills.
6. I optimized the transformer model's performance by manually adjusting the number of epochs (learning cycles) and the size of the training data CSV file.

## 💭 Impression

1. It was a valuable opportunity to experience the entire software development lifecycle (SDLC) from development to deployment and operation.
2. Our team lacked collaboration experience, but by learning tools like Github and FileZilla together, we were able to improve our collaboration skills.
3. Due to errors and limited resources, some planned features couldn’t be implemented, and I wasn’t able to fully optimize the AI model’s training process. 
→ After completing the project, I solved these issues and added new features, which allowed me to submit a new version to a competition.

---

# AI Translation-enabled Reservation Management Chatbot (Space Chat) Ver. 2 (main branch)

## ⚙️ System Architecture
![image](https://github.com/user-attachments/assets/3b382116-86d2-4650-a28a-8500aba863c1)

📍 Compared to Ver.1, the transformer model has been replaced by GPT fine-tuning, and Google Calendar API and ChatGPT API have been added.

## 🖥️ What I did

- Conducted real user testing with both Korean and foreign users and incorporated feedback
![image](https://github.com/user-attachments/assets/75e718c2-9c23-4743-837d-42ea1c7b3ecc)
  
- Added validation for unexpected input values to prevent malfunctions and improve service stability
- Addressed issues with the slow learning and response times of the transformer model and differences in answer accuracy due to the number of learning cycles → Replaced the transformer model with GPT fine-tuning
![image](https://github.com/user-attachments/assets/d1b73f84-b990-462a-a233-feffc0f85cc8)
![image](https://github.com/user-attachments/assets/661b45f7-0931-4b99-9e18-9a67a11e16e5)
  
- Fixed CSRF error that occurred during the redirect step of Google OAuth2 login by separating the authentication server and handling the process in the background, enabling a stable login flow
![image](https://github.com/user-attachments/assets/197646fc-9f7d-4a9a-8849-bee8f448b654)
![image](https://github.com/user-attachments/assets/f25455e6-aca3-4bb0-a379-b1eaf6561425)
  
- Enabled administrators to automatically add reservation schedules to their Google Calendar after logging in with their Google account  
  → Reservation data is automatically updated every hour through background job scheduling



## 💭 Impression

1. I was able to improve my problem-solving skills by resolving existing issues, and I learned how to refactor a project.
2. Incorporating user feedback and improving features helped me gain a better understanding of designing user-friendly services.
3. While addressing OAuth2 CSRF issues, I deepened my understanding of the security considerations essential for implementing social logins.


## 🚀 **Technology Stack**

- **Used Stacks**: Python, Flask, HTML, CSS, JavaScript, MySQL
- **Used Tools**: Git, Visual Studio Code, EC2, Apache2, RDS, TensorFlow, DeepL API, GPT API
- **Used Collaborations**: Notion, GitHub

## 🖼️ Implementation Images
![image](https://github.com/user-attachments/assets/2f2c85d9-7829-42b1-8197-1a50ad35ff25)
![image](https://github.com/user-attachments/assets/8c934838-a35a-4321-8ca7-b1439008c732)
![image](https://github.com/user-attachments/assets/e1f1754d-fc88-499e-a4bb-64b8ac778474)
![image](https://github.com/user-attachments/assets/cd508f69-1725-4348-88dc-561cb2e5301f)
![image](https://github.com/user-attachments/assets/47bb2afe-7bc9-4e2f-a1d2-0039a7b0f060)
![image](https://github.com/user-attachments/assets/e6404825-cc01-4369-bd3f-e5e0f65d92f6)
![image](https://github.com/user-attachments/assets/ae981674-2737-44bb-81fd-f481a13a9c0e)
![image](https://github.com/user-attachments/assets/b7a1856a-afcc-475b-895d-e49a93364fe0)
![image](https://github.com/user-attachments/assets/0f9a0bfe-42eb-4fe0-ac3d-da33bb02a580)
![image](https://github.com/user-attachments/assets/bf8d2555-e6ae-41f0-a9bd-68b49156e0cf)
![image](https://github.com/user-attachments/assets/b2e34a9d-3045-43d6-8907-8f1ab338e5db)
