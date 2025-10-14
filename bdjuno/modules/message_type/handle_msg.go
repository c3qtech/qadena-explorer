package message_type

import (
	"fmt"

	utils "github.com/forbole/callisto/v4/modules/utils"
	msgtypes "github.com/forbole/callisto/v4/types"

	juno "github.com/forbole/juno/v6/types"
)

// HandleMsg represents a message handler that stores the given message inside the proper database table
func (m *Module) HandleMsg(
	index int, msg juno.Message, tx *juno.Transaction) error {
	fmt.Println("XXXXXXXXXXXXXXXXX msg", msg)
	// Save message type
	err := m.db.SaveMessageType(msgtypes.NewMessageType(
		msg.GetType(),
		utils.GetModuleNameFromTypeURL(msg.GetType()),
		utils.GetMsgFromTypeURL(msg.GetType()),
		int64(tx.Height)))

	if err != nil {
		return err
	}

	return nil
}
