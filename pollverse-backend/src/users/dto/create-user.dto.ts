export class CreateUserDto {
    username?: string;
    avatar?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    bio?: string;
    location?: string;
    website?: string;
    profession?: string;
    interests?: string[];
    dateOfBirth?: Date;
    socialLinks?: { twitter?: string; instagram?: string; linkedin?: string; github?: string };
}
