import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../../../src/components/AppText";
import ChoreListItem from "../../../features/lists/components/choreListItem";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/theme";
import { listStyles } from "./ItemModal";

interface ChoreMemberCardProps {
  member: {
    id: string;
    username: string;
    color?: string;
  };
  memberItems: any[]; // Aapka chore object type yahan aa sakta hai
  totalCount: number;
  completedCount: number;
  userProfile: {
    id: string;
  } | null;
  familyMembers: any[];
  handleToggleItem: (item: any) => void;
  handleDeleteItem: (item: any) => void;
  handleEditItem: (item: any) => void;
}

const ChoreMemberCard = ({
  member,
  memberItems,
  totalCount,
  completedCount,
  userProfile,
  familyMembers,
  handleToggleItem,
  handleDeleteItem,
  handleEditItem,
}: ChoreMemberCardProps) => {
  return (
    <View key={member.id} style={listStyles.memberCard}>
      <View
        style={[
          listStyles.memberHeader,
          { borderLeftColor: member.color || "#1E3A8A" },
        ]}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              listStyles.memberAvatar,
              { backgroundColor: member.color || "#1E3A8A" },
            ]}
          >
            <AppText style={listStyles.avatarLetter}>
              {member.username ? member.username[0].toUpperCase() : "?"}
            </AppText>
          </View>
          <AppText style={listStyles.memberName}>
            {member.username}'s Chores
          </AppText>
        </View>
        <View
          style={[
            listStyles.progressBadge,
            { backgroundColor: (member.color || "#1E3A8A") + "15" },
          ]}
        >
          <AppText
            style={[
              listStyles.progressText,
              { color: member.color || "#1E3A8A" },
            ]}
          >
            {totalCount > 0 ? `${completedCount}/${totalCount}` : "0/0"}
          </AppText>
        </View>
      </View>

      <View style={listStyles.itemsContainer}>
        {memberItems.length > 0 ? (
          memberItems.map((chore: any) => (
            <ChoreListItem
              key={chore.id}
              item={chore}
              canEdit={
                chore.created_by === userProfile?.id ||
                (chore.assigned_to === userProfile?.id &&
                  chore.visibility !== "view")
              }
              onDelete={() => handleDeleteItem(chore)}
              showAssignedBadge={!!chore.assigned_to}
              assignedMember={familyMembers.find(
                (m) => m.id === chore.assigned_to,
              )}
              onToggle={() => handleToggleItem(chore)}
              onPress={() => handleEditItem(chore)}
            />
          ))
        ) : (
          <View style={listStyles.emptyStateContainer}>
            <Ionicons name="cafe-outline" size={20} color={COLORS.textMuted} />
            <AppText style={listStyles.emptyMemberText}>
              Relax! No chores for today.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
};

export default ChoreMemberCard;
