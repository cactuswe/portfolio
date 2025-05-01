# MessageBox

A real-time interactive message board with physics-based animations. Messages float and collide in a shared space, creating an engaging communication experience.

## Features

- Real-time message updates using Firebase
- Physics-based message interactions using Matter.js
- Mobile-responsive design
- Admin panel for moderation
- Privacy-conscious data collection
- Cookie consent management
- Cooldown system to prevent spam

## Technical Stack

- Frontend: Vanilla JavaScript
- Physics Engine: Matter.js
- Database: Firebase Realtime Database
- Authentication: Firebase Auth

## Setup

1. Clone the repository
2. Configure Firebase:
   - Create a Firebase project
   - Enable Realtime Database
   - Enable Authentication
   - Update firebase.js with your config

## Project Structure


```
MessageBox/
├── js/
│   ├── firebase.js      # Firebase configuration
│   ├── physics.js       # Matter.js physics implementation
│   └── script.js        # Main application logic
├── admin/
│   ├── admin.js         # Admin panel functionality
│   ├── admin.css        # Admin styles
│   ├── index.html       # Admin dashboard
│   ├── login.html       # Admin login
│   └── login.js         # Login handling
├── privacy-policy/
│   └── index.html       # Privacy policy page
├── style.css            # Main application styles
└── index.html           # Main application page

```

## Contributing

This is a solo project maintained by an independent front-end developer. Feel free to submit issues or suggestions.

## Privacy

See privacy-policy/index.html for detailed information about data collection and usage.

## License

All rights reserved. This code is private and not for distribution.
