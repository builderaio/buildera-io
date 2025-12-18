import { SocialConnectionManager } from "../SocialConnectionManager";

interface ADNSocialTabProps {
  profile: any;
}

export const ADNSocialTab = ({ profile }: ADNSocialTabProps) => {
  return (
    <div className="space-y-6">
      <SocialConnectionManager 
        profile={profile} 
        onConnectionsUpdated={() => {}}
      />
    </div>
  );
};
