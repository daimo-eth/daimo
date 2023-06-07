// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

struct Note {
    address ephemeralOwner;
    address from;
    uint256 amount;
}

/**
 * @title EphemeralNotes
 * @notice Simple escrow notes, used for onboarding new accounts.
 * Notes are created by a user and can be redeemed by anyone who shows
 * a signature from the ephemeral key owner for their address. Additionally,
 * the sender of the note can "revert" it without a signature.
 */
contract EphemeralNotes {
  mapping(address => Note) public notes;
  IERC20 public immutable token;
  
  event NoteCreated(Note note);
  event NoteRedeemed(Note note);

  constructor(IERC20 _token) {
    token = _token;
  }


  // Call token.approve(<address of this contract>, amount) on the token contract before this
  function createNote(
    address _ephemeralOwner,
    uint256 _amount
  ) external {
    require(notes[_ephemeralOwner].ephemeralOwner == address(0), "EphemeralNotes: note already exists");
    require(_ephemeralOwner != address(0));
    require(_amount > 0);

    notes[_ephemeralOwner] = Note({
      ephemeralOwner: _ephemeralOwner,
      from: msg.sender,
      amount: _amount
    });

    emit NoteCreated(notes[_ephemeralOwner]);
    token.transferFrom(msg.sender, address(this), _amount);
  }

  // Either the recipient (with a valid signature) or the sender can redeem the note
  function claimNote(
    address _ephemeralOwner,
    bytes memory _signature
  ) external {
    Note memory note = notes[_ephemeralOwner];
    require(note.ephemeralOwner != address(0), "EphemeralNotes: note does not exist");

    bytes32 message = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(msg.sender)));
    address signer = ECDSA.recover(message, _signature);
    require(signer == _ephemeralOwner || msg.sender == note.from, "EphemeralNotes: invalid signature and not creator");

    emit NoteRedeemed(note);
    delete notes[_ephemeralOwner];
    token.transfer(msg.sender, note.amount);
  }
}