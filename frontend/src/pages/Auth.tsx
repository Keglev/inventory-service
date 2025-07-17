import { Button, Card, Typography } from '@mui/material';

const Auth = () => {
  const handleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="p-8 shadow-lg w-full max-w-md text-center">
        <Typography variant="h4" gutterBottom>
          Smart Supply Pro
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Please sign in to continue
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          sx={{ mt: 2 }}
        >
          Login with Google
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 4, color: 'gray' }}>
          © {new Date().getFullYear()} Smart Supply Pro
        </Typography>
      </Card>
    </div>
  );
};

export default Auth;
