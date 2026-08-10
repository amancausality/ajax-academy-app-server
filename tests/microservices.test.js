const assert = require('assert');

(async () => {
  const services = [
    { name: 'identity-service', url: 'http://localhost:5001/auth/profile' },
    { name: 'course-service', url: 'http://localhost:5002/courses' },
    { name: 'enrollment-service', url: 'http://localhost:5003/enrollments' },
    { name: 'progress-service', url: 'http://localhost:5004/progress' },
    { name: 'notification-service', url: 'http://localhost:5005/notifications' },
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, { method: 'GET' });
      const body = await response.text();
      assert.ok(response.ok || response.status < 500, `${service.name} did not respond successfully`);
      console.log(`${service.name}: OK (${response.status})`);
    } catch (error) {
      console.error(`${service.name}: FAILED`, error.message);
      process.exitCode = 1;
    }
  }
})();
